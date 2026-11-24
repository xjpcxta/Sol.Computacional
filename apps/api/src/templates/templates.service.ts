import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import {
  calculateFunctionPointTotals,
  getFunctionPointWeight,
} from '../estimates/function-point-calculator';

type CalculationBasis = NonNullable<CreateTemplateDto['calculationBasis']>;

const TEMPLATE_INCLUDE = {
  components: { orderBy: { createdAt: 'asc' } },
  serviceActivities: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.TemplateInclude;

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const templates = await this.prisma.template.findMany({
      include: TEMPLATE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((template) => this.toResponse(template));
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: TEMPLATE_INCLUDE,
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return this.toResponse(template);
  }

  async create(data: CreateTemplateDto) {
    const calculationBasis = data.calculationBasis ?? 'function-points';
    const content = this.prepareContent(data, calculationBasis);

    try {
      const template = await this.prisma.template.create({
        data: {
          name: content.name,
          category: data.category,
          description: content.description,
          calculationBasis,
          ...content.totals,
          ...(calculationBasis === 'function-points'
            ? { components: { create: content.components } }
            : { serviceActivities: { create: content.serviceActivities } }),
        },
        include: TEMPLATE_INCLUDE,
      });

      return this.toResponse(template);
    } catch (error) {
      this.rethrowKnownError(error);
    }
  }

  /**
   * Atualiza um arquétipo substituindo toda a sua composição.
   * O tipo de cálculo é fixo: um arquétipo por PF continua por PF e um serviço continua por horas.
   * Estimativas já salvas não mudam, pois guardam a própria cópia dos componentes.
   */
  async update(id: string, data: CreateTemplateDto) {
    const existing = await this.prisma.template.findUnique({
      where: { id },
      select: { calculationBasis: true },
    });
    if (!existing) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    const calculationBasis = existing.calculationBasis as CalculationBasis;
    if (data.calculationBasis && data.calculationBasis !== calculationBasis) {
      throw new BadRequestException('O tipo de cálculo de um arquétipo existente não pode ser alterado.');
    }
    const content = this.prepareContent(data, calculationBasis);

    try {
      const template = await this.prisma.$transaction(async (tx) => {
        await tx.templateComponent.deleteMany({ where: { templateId: id } });
        await tx.templateServiceActivity.deleteMany({ where: { templateId: id } });

        return tx.template.update({
          where: { id },
          data: {
            name: content.name,
            category: data.category,
            description: content.description,
            ...content.totals,
            ...(calculationBasis === 'function-points'
              ? { components: { create: content.components } }
              : { serviceActivities: { create: content.serviceActivities } }),
          },
          include: TEMPLATE_INCLUDE,
        });
      });

      return this.toResponse(template);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Template with ID ${id} not found`);
      }
      this.rethrowKnownError(error);
    }
  }

  /** Valida o conteúdo enviado e calcula os PF de cada componente pela matriz oficial. */
  private prepareContent(data: CreateTemplateDto, calculationBasis: CalculationBasis) {
    const name = data.name.trim();
    const description = data.description.trim();
    if (name.length < 3 || description.length < 20) {
      throw new BadRequestException('Nome e descrição do arquétipo não podem conter apenas espaços.');
    }
    const components = calculationBasis === 'function-points'
      ? (data.components ?? []).map((component) => {
        const componentName = component.name.trim();
        const componentDescription = component.description.trim();
        if (componentName.length < 3 || componentDescription.length < 30) {
          throw new BadRequestException('Cada componente precisa de nome e descrição detalhada válidos.');
        }
        const unitPf = getFunctionPointWeight(component.functionType, component.complexity);

        return {
          name: componentName,
          description: componentDescription,
          functionType: component.functionType,
          complexity: component.complexity,
          quantity: component.quantity,
          unitPf,
          totalPf: unitPf * component.quantity,
        };
      })
      : [];
    const serviceActivities = calculationBasis === 'service-hours'
      ? (data.serviceActivities ?? []).map((activity) => {
        const activityName = activity.name.trim();
        const activityDescription = activity.description.trim();
        if (
          activityName.length < 3
          || activityDescription.length < 30
          || !Number.isFinite(activity.estimatedHours)
          || activity.estimatedHours < 0.25
          || activity.estimatedHours > 10_000
        ) {
          throw new BadRequestException('Cada atividade precisa de nome, descrição detalhada e horas válidas.');
        }

        return {
          name: activityName,
          description: activityDescription,
          estimatedHours: activity.estimatedHours,
        };
      })
      : [];

    if (calculationBasis === 'function-points' && components.length === 0) {
      throw new BadRequestException('Um arquétipo funcional precisa de pelo menos um componente contado.');
    }
    if (calculationBasis === 'service-hours' && serviceActivities.length === 0) {
      throw new BadRequestException('Um serviço precisa de pelo menos uma atividade estimada.');
    }
    const { pfAli, pfAie, pfEe, pfSe, pfCe } = calculateFunctionPointTotals(components);

    return {
      name,
      description,
      components,
      serviceActivities,
      totals: { pfAli, pfAie, pfEe, pfSe, pfCe },
    };
  }

  private rethrowKnownError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Já existe um arquétipo com este nome.');
    }
    throw error;
  }

  private toResponse<T extends {
    calculationBasis?: string;
    components: Array<{
      functionType: string;
      complexity: string;
      quantity: number;
    }>;
    serviceActivities?: Array<{ estimatedHours: number }>;
  }>(template: T) {
    const components = template.components.map((component) => {
      const unitPf = getFunctionPointWeight(
        component.functionType as Parameters<typeof getFunctionPointWeight>[0],
        component.complexity as Parameters<typeof getFunctionPointWeight>[1],
      );
      return { ...component, unitPf, totalPf: unitPf * component.quantity };
    });
    const totals = calculateFunctionPointTotals(components.map((component) => ({
      functionType: component.functionType as Parameters<typeof getFunctionPointWeight>[0],
      complexity: component.complexity as Parameters<typeof getFunctionPointWeight>[1],
      quantity: component.quantity,
    })));

    return {
      ...template,
      calculationBasis: template.calculationBasis ?? 'function-points',
      serviceActivities: template.serviceActivities ?? [],
      components,
      serviceHours: (template.serviceActivities ?? []).reduce(
        (sum, activity) => sum + activity.estimatedHours,
        0,
      ),
      ...totals,
    };
  }
}
