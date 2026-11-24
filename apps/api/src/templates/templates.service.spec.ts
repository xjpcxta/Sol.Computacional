import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from './templates.service';

function createService() {
  const prisma = {
    template: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    templateComponent: {
      deleteMany: vi.fn(),
    },
    templateServiceActivity: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));

  return {
    prisma,
    service: new TemplatesService(prisma as unknown as PrismaService),
  };
}

describe('TemplatesService', () => {
  it('derives aggregate fields and component weights when creating an archetype', async () => {
    const { prisma, service } = createService();
    prisma.template.create.mockImplementation(async ({ data }: { data: any }) => ({
      id: 'template-1',
      ...data,
      components: data.components.create.map((component: object, index: number) => ({
        id: `component-${index}`,
        templateId: 'template-1',
        ...component,
      })),
      serviceActivities: [],
    }));

    const result = await service.create({
      name: 'Portal do cliente',
      category: 'frontend',
      description: 'Portal completo para autosserviço e acompanhamento do cliente.',
      components: [
        {
          name: 'Dados do cliente',
          description: 'Mantém informações funcionais reconhecidas e atualizadas pelo próprio cliente.',
          functionType: 'ALI',
          complexity: 'medium',
          quantity: 1,
        },
        {
          name: 'Consulta de situação',
          description: 'Consulta o andamento solicitado sem atualizar os dados funcionais existentes.',
          functionType: 'CE',
          complexity: 'low',
          quantity: 2,
        },
      ],
    });

    expect(prisma.template.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        pfAli: 10,
        pfAie: 0,
        pfEe: 0,
        pfSe: 0,
        pfCe: 6,
      }),
    }));
    expect(result.totalPf).toBe(16);
    expect(result.components).toEqual(expect.arrayContaining([
      expect.objectContaining({ unitPf: 10, totalPf: 10 }),
      expect.objectContaining({ unitPf: 3, totalPf: 6 }),
    ]));
  });

  it('creates a service archetype and derives its total estimated hours', async () => {
    const { prisma, service } = createService();
    prisma.template.create.mockImplementation(async ({ data }: { data: any }) => ({
      id: 'service-template',
      ...data,
      components: [],
      serviceActivities: data.serviceActivities.create.map((activity: object, index: number) => ({
        id: `activity-${index}`,
        templateId: 'service-template',
        ...activity,
      })),
    }));

    const result = await service.create({
      name: 'Avaliação de riscos',
      category: 'security',
      description: 'Revisão independente de riscos técnicos com diagnóstico e recomendações.',
      calculationBasis: 'service-hours',
      serviceActivities: [
        {
          name: 'Coleta de evidências',
          description: 'Reúne documentação, acessos e evidências necessárias para orientar a avaliação.',
          estimatedHours: 12,
        },
        {
          name: 'Relatório priorizado',
          description: 'Documenta achados, severidade, impacto e recomendações de tratamento priorizadas.',
          estimatedHours: 20,
        },
      ],
    });

    expect(result).toMatchObject({
      calculationBasis: 'service-hours',
      totalPf: 0,
      serviceHours: 32,
      components: [],
    });
    expect(result.serviceActivities).toHaveLength(2);
  });

  it('translates a unique-name database violation into a conflict', async () => {
    const { prisma, service } = createService();
    prisma.template.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.12.0',
      }),
    );

    await expect(service.create({
      name: 'Duplicado',
      category: 'backend',
      description: 'Descrição suficientemente detalhada para o arquétipo duplicado.',
      components: [{
        name: 'Cadastro duplicado',
        description: 'Mantém os dados necessários para validar o cenário de nome duplicado.',
        functionType: 'ALI',
        complexity: 'low',
        quantity: 1,
      }],
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects whitespace-only audited content even when called outside the HTTP pipe', async () => {
    const { service } = createService();

    await expect(service.create({
      name: '   ',
      category: 'backend',
      description: ' '.repeat(40),
      components: [{
        name: '   ',
        description: ' '.repeat(40),
        functionType: 'ALI',
        complexity: 'low',
        quantity: 1,
      }],
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('derives catalog totals and component weights from the authoritative matrix', async () => {
    const { prisma, service } = createService();
    prisma.template.findMany.mockResolvedValue([{
      id: 'template-drifted',
      name: 'Cadastro com cache divergente',
      category: 'backend',
      description: 'Cenário que garante a correção de valores derivados antigos.',
      pfAli: 999,
      pfAie: 999,
      pfEe: 999,
      pfSe: 999,
      pfCe: 999,
      calculationBasis: 'function-points',
      serviceActivities: [],
      components: [{
        id: 'component-drifted',
        templateId: 'template-drifted',
        name: 'Dados principais',
        description: 'Mantém dados reconhecidos pelo usuário para validar o cálculo autoritativo.',
        functionType: 'ALI',
        complexity: 'medium',
        quantity: 2,
        unitPf: 999,
        totalPf: 1998,
      }],
    }]);

    const [result] = await service.findAll();

    expect(result).toMatchObject({ pfAli: 20, totalPf: 20 });
    expect(result.components[0]).toMatchObject({ unitPf: 10, totalPf: 20 });
  });

  it('rejects an unknown template id', async () => {
    const { prisma, service } = createService();
    prisma.template.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('update', () => {
    const editedArchetype = {
      name: 'Portal do cliente',
      category: 'frontend' as const,
      description: 'Portal completo para autosserviço e acompanhamento do cliente.',
      calculationBasis: 'function-points' as const,
      components: [
        {
          name: 'Dados do cliente',
          description: 'Mantém informações funcionais reconhecidas e atualizadas pelo próprio cliente.',
          functionType: 'ALI' as const,
          complexity: 'high' as const,
          quantity: 1,
        },
        {
          name: 'Envio de solicitação',
          description: 'Recebe uma nova solicitação do cliente e grava os dados funcionais correspondentes.',
          functionType: 'EE' as const,
          complexity: 'medium' as const,
          quantity: 3,
        },
      ],
    };

    it('replaces the whole composition and recalculates the totals', async () => {
      const { prisma, service } = createService();
      prisma.template.findUnique.mockResolvedValue({ calculationBasis: 'function-points' });
      prisma.template.update.mockImplementation(async ({ data }: { data: any }) => ({
        id: 'template-1',
        ...data,
        components: data.components.create.map((component: object, index: number) => ({
          id: `component-${index}`,
          templateId: 'template-1',
          ...component,
        })),
        serviceActivities: [],
      }));

      const result = await service.update('template-1', editedArchetype);

      expect(prisma.templateComponent.deleteMany).toHaveBeenCalledWith({ where: { templateId: 'template-1' } });
      expect(prisma.templateServiceActivity.deleteMany).toHaveBeenCalledWith({ where: { templateId: 'template-1' } });
      expect(prisma.template.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'template-1' },
        data: expect.objectContaining({ pfAli: 15, pfEe: 12, pfCe: 0 }),
      }));
      expect(result.totalPf).toBe(27);
      expect(result.components).toHaveLength(2);
      expect(result.components).toEqual(expect.arrayContaining([
        expect.objectContaining({ unitPf: 15, totalPf: 15 }),
        expect.objectContaining({ unitPf: 4, totalPf: 12 }),
      ]));
    });

    it('rejects an unknown template id without touching the composition', async () => {
      const { prisma, service } = createService();
      prisma.template.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', editedArchetype)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('keeps the calculation basis fixed', async () => {
      const { prisma, service } = createService();
      prisma.template.findUnique.mockResolvedValue({ calculationBasis: 'service-hours' });

      await expect(service.update('service-template', editedArchetype)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('requires at least one component', async () => {
      const { prisma, service } = createService();
      prisma.template.findUnique.mockResolvedValue({ calculationBasis: 'function-points' });

      await expect(service.update('template-1', { ...editedArchetype, components: [] }))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('translates a unique-name database violation into a conflict', async () => {
      const { prisma, service } = createService();
      prisma.template.findUnique.mockResolvedValue({ calculationBasis: 'function-points' });
      prisma.template.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '6.12.0',
        }),
      );

      await expect(service.update('template-1', editedArchetype)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
