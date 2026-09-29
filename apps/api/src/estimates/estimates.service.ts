import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CostProfileService } from '../cost-profile/cost-profile.service';
import { CreateEstimateDto, CreateEstimateItemDto } from './dto/create-estimate.dto';
import { ListEstimatesDto } from './dto/list-estimates.dto';
import { ESTIMATE_PRESETS } from './estimate-presets';
import {
  calculateCommercialTotals,
  FUNCTION_POINT_WEIGHTS,
  getFunctionPointWeight,
  type ComplexityValue,
  type FunctionTypeValue,
} from './function-point-calculator';

@Injectable()
export class EstimatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly costProfileService: CostProfileService,
  ) {}

  async getConfiguration() {
    const names = [...new Set(ESTIMATE_PRESETS.flatMap((preset) => preset.templateNames))];
    const templates = await this.prisma.template.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true },
    });
    const idsByName = new Map(templates.map((template) => [template.name, template.id]));
    const missingNames = names.filter((name) => !idsByName.has(name));
    if (missingNames.length > 0) {
      throw new ServiceUnavailableException(
        `As configurações iniciais estão incompletas. Arquétipos ausentes: ${missingNames.join(', ')}.`,
      );
    }

    return {
      presets: ESTIMATE_PRESETS.map((preset) => ({
        ...preset,
        templateNames: [...preset.templateNames],
        templateIds: preset.templateNames
          .map((name) => idsByName.get(name))
          .filter((id): id is string => Boolean(id)),
      })),
      weights: FUNCTION_POINT_WEIGHTS,
    };
  }

  async create(userId: string, data: CreateEstimateDto) {
    const title = data.title.trim();
    const clientName = data.clientName.trim();
    const scopeBoundary = data.scopeBoundary.trim();
    const calculationNotes = data.calculationNotes.trim();
    if (
      title.length < 3
      || clientName.length < 2
      || scopeBoundary.length < 30
      || calculationNotes.length < 20
    ) {
      throw new BadRequestException('Título, cliente, fronteira e premissas precisam de conteúdo válido.');
    }
    const costProfile = await this.costProfileService.findByUserId(userId);
    const templateIds = [...new Set(data.items
      .filter((item) => item.kind === 'archetype')
      .map((item) => item.templateId)
      .filter((id): id is string => Boolean(id)))];
    const templates = await this.prisma.template.findMany({
      where: { id: { in: templateIds } },
      include: { components: { orderBy: { createdAt: 'asc' } } },
    });
    const templatesById = new Map(templates.map((template) => [template.id, template]));

    if (templates.length !== templateIds.length) {
      throw new BadRequestException('Um ou mais arquétipos selecionados não existem mais.');
    }

    const items = data.items.map((item) => this.snapshotItem(item, templatesById));
    const totalPf = items.reduce((sum, item) => sum + item.totalPf, 0);
    const totals = calculateCommercialTotals(
      totalPf,
      costProfile.hourlyRate,
      costProfile.hoursPerPf,
      costProfile.riskMargin,
    );

    return this.prisma.estimate.create({
      data: {
        userId,
        title,
        clientName,
        presetKey: data.presetKey ?? null,
        status: data.status,
        scopeBoundary,
        calculationNotes,
        hourlyRate: costProfile.hourlyRate,
        hoursPerPf: costProfile.hoursPerPf,
        riskMargin: costProfile.riskMargin,
        ...totals,
        sentAt: data.status === 'sent' ? new Date() : null,
        items: {
          create: items.map((item) => ({
            templateId: item.templateId,
            kind: item.kind,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            totalPf: item.totalPf,
            components: { create: item.components },
          })),
        },
      },
      include: this.detailInclude,
    });
  }

  async findAll(userId: string, query: ListEstimatesDto) {
    return this.prisma.estimate.findMany({
      where: {
        userId,
        ...(query.status ? { status: query.status } : {}),
      },
      select: {
        id: true,
        title: true,
        clientName: true,
        presetKey: true,
        status: true,
        totalPf: true,
        estimatedHours: true,
        totalPrice: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: query.status === 'sent'
        ? [{ sentAt: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' },
      take: query.limit ?? 50,
    });
  }

  async findOne(userId: string, id: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, userId },
      include: this.detailInclude,
    });

    if (!estimate) {
      throw new NotFoundException('Estimativa não encontrada.');
    }

    return estimate;
  }

  async updateStatus(userId: string, id: string, status: 'draft' | 'sent') {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, userId },
      select: { id: true, sentAt: true },
    });

    if (!estimate) {
      throw new NotFoundException('Estimativa não encontrada.');
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        status,
        sentAt: status === 'sent' ? estimate.sentAt ?? new Date() : null,
      },
      include: this.detailInclude,
    });
  }

  private readonly detailInclude = {
    items: {
      orderBy: { createdAt: 'asc' as const },
      include: {
        components: { orderBy: { createdAt: 'asc' as const } },
      },
    },
  };

  private snapshotItem(
    item: CreateEstimateItemDto,
    templatesById: Map<string, {
      id: string;
      name: string;
      description: string;
      components: Array<{
        name: string;
        description: string;
        functionType: string;
        complexity: string;
        quantity: number;
        unitPf: number;
      }>;
    }>,
  ) {
    if (item.kind === 'archetype') {
      const template = item.templateId ? templatesById.get(item.templateId) : undefined;
      if (!template) {
        throw new BadRequestException('O arquétipo selecionado é inválido.');
      }

      if (template.components.length === 0 || template.components.some((component) => component.quantity < 1)) {
        throw new BadRequestException(
          `O arquétipo “${template.name}” precisa ter sua memória de cálculo revisada antes de ser estimado.`,
        );
      }

      const components = template.components.map((component) => {
        const unitPf = getFunctionPointWeight(
          component.functionType as FunctionTypeValue,
          component.complexity as ComplexityValue,
        );
        const quantity = component.quantity * item.quantity;
        return {
          name: component.name,
          description: component.description,
          functionType: component.functionType,
          complexity: component.complexity,
          quantity,
          unitPf,
          totalPf: unitPf * quantity,
        };
      });

      return {
        templateId: template.id,
        kind: item.kind,
        name: template.name,
        description: template.description,
        quantity: item.quantity,
        totalPf: components.reduce((sum, component) => sum + component.totalPf, 0),
        components,
      };
    }

    if (!item.name || !item.description || !item.components?.length) {
      throw new BadRequestException('A funcionalidade personalizada está incompleta.');
    }

    if (item.name.trim().length < 3 || item.description.trim().length < 30) {
      throw new BadRequestException('A funcionalidade personalizada precisa de nome e descrição válidos.');
    }

    const components = item.components.map((component) => {
      if (component.name.trim().length < 3 || component.description.trim().length < 30) {
        throw new BadRequestException('Cada componente personalizado precisa de nome e descrição válidos.');
      }
      const unitPf = getFunctionPointWeight(
        component.functionType as FunctionTypeValue,
        component.complexity as ComplexityValue,
      );
      const quantity = component.quantity * item.quantity;

      return {
        name: component.name.trim(),
        description: component.description.trim(),
        functionType: component.functionType,
        complexity: component.complexity,
        quantity,
        unitPf,
        totalPf: unitPf * quantity,
      };
    });

    return {
      templateId: null,
      kind: item.kind,
      name: item.name.trim(),
      description: item.description.trim(),
      quantity: item.quantity,
      totalPf: components.reduce((sum, component) => sum + component.totalPf, 0),
      components,
    };
  }
}
