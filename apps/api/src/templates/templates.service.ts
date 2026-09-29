import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import {
  calculateFunctionPointTotals,
  getFunctionPointWeight,
} from '../estimates/function-point-calculator';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const templates = await this.prisma.template.findMany({
      include: { components: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((template) => this.toResponse(template));
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: { components: { orderBy: { createdAt: 'asc' } } },
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return this.toResponse(template);
  }

  async create(data: CreateTemplateDto) {
    const name = data.name.trim();
    const description = data.description.trim();
    if (name.length < 3 || description.length < 20) {
      throw new BadRequestException('Nome e descrição do arquétipo não podem conter apenas espaços.');
    }
    const components = data.components.map((component) => {
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
    });
    const totals = calculateFunctionPointTotals(components);

    try {
      const template = await this.prisma.template.create({
        data: {
          name,
          category: data.category,
          description,
          pfAli: totals.pfAli,
          pfAie: totals.pfAie,
          pfEe: totals.pfEe,
          pfSe: totals.pfSe,
          pfCe: totals.pfCe,
          components: { create: components },
        },
        include: { components: { orderBy: { createdAt: 'asc' } } },
      });

      return this.toResponse(template);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um arquétipo com este nome.');
      }
      throw error;
    }
  }

  private toResponse<T extends {
    components: Array<{
      functionType: string;
      complexity: string;
      quantity: number;
    }>;
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
      components,
      ...totals,
    };
  }
}
