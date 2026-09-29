import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import type { CostProfileService } from '../cost-profile/cost-profile.service';
import { EstimatesService } from './estimates.service';

function createService() {
  const prisma = {
    template: { findMany: vi.fn() },
    estimate: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  const costProfileService = {
    findByUserId: vi.fn().mockResolvedValue({
      hourlyRate: 150,
      hoursPerPf: 10,
      riskMargin: 15,
    }),
  };

  return {
    prisma,
    costProfileService,
    service: new EstimatesService(
      prisma as unknown as PrismaService,
      costProfileService as unknown as CostProfileService,
    ),
  };
}

const archetype = {
  id: '8d3842d4-4403-45c2-9094-11e1e803d878',
  name: 'Cadastro base',
  description: 'Cadastro base usado para validar a fotografia do arquétipo.',
  components: [{
    name: 'Dados principais',
    description: 'Mantém o grupo lógico de dados reconhecido pelo usuário do sistema.',
    functionType: 'ALI',
    complexity: 'medium',
    quantity: 1,
    unitPf: 999,
  }],
};

describe('EstimatesService', () => {
  it('resolves preset names into current template ids', async () => {
    const { prisma, service } = createService();
    const presetTemplates = [
      'Landing Page',
      'Autenticação',
      'CRUD Simples',
      'CRUD Complexo',
      'API REST Integração',
      'Dashboard com Gráficos',
      'Relatório PDF',
      'Upload de Arquivos',
    ].map((name, index) => ({ id: `template-${index}`, name }));
    prisma.template.findMany.mockResolvedValue(presetTemplates);

    const configuration = await service.getConfiguration();
    const mvp = configuration.presets.find((preset) => preset.key === 'mvp');

    expect(mvp?.templateIds).toEqual([
      'template-0',
      'template-1',
      'template-2',
      'template-5',
    ]);
    expect(configuration.weights.ALI.medium).toBe(10);
  });

  it('fails configuration explicitly when a preset archetype is unavailable', async () => {
    const { prisma, service } = createService();
    prisma.template.findMany.mockResolvedValue([{ id: 'template-landing', name: 'Landing Page' }]);

    await expect(service.getConfiguration()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('snapshots archetype and custom components and calculates commercial totals', async () => {
    const { prisma, service } = createService();
    prisma.template.findMany.mockResolvedValue([archetype]);
    prisma.estimate.create.mockImplementation(async ({ data }: { data: any }) => data);

    const result = await service.create('user-1', {
      title: 'Portal comercial',
      clientName: 'Cliente de teste',
      scopeBoundary: 'A fronteira considera o portal web e exclui o sistema financeiro já existente.',
      calculationNotes: 'A produtividade usa o perfil atual e considera a integração documentada pelo cliente.',
      presetKey: 'mvp',
      status: 'sent',
      items: [
        {
          kind: 'archetype',
          templateId: archetype.id,
          quantity: 2,
        },
        {
          kind: 'custom',
          name: 'Aprovação especial',
          description: 'Fluxo adicional de aprovação solicitado para a governança específica do cliente.',
          quantity: 1,
          components: [{
            name: 'Entrada da aprovação',
            description: 'Recebe a decisão do aprovador e altera o estado funcional da solicitação.',
            functionType: 'EE',
            complexity: 'high',
            quantity: 1,
          }],
        },
      ],
    });

    expect(result).toMatchObject({
      totalPf: 26,
      estimatedHours: 260,
      baseCost: 39_000,
      riskAmount: 5_850,
      totalPrice: 44_850,
      status: 'sent',
      items: {
        create: [
          expect.objectContaining({
            templateId: archetype.id,
            quantity: 2,
            totalPf: 20,
            components: { create: [expect.objectContaining({ quantity: 2, totalPf: 20 })] },
          }),
          expect.objectContaining({
            templateId: null,
            totalPf: 6,
            components: { create: [expect.objectContaining({ unitPf: 6, totalPf: 6 })] },
          }),
        ],
      },
    });
    expect(result.sentAt).toBeInstanceOf(Date);
  });

  it('rejects an archetype removed after the board was composed', async () => {
    const { prisma, service } = createService();
    prisma.template.findMany.mockResolvedValue([]);

    await expect(service.create('user-1', {
      title: 'Estimativa inválida',
      clientName: 'Cliente de teste',
      scopeBoundary: 'A fronteira funcional foi descrita com detalhe suficiente para validação.',
      calculationNotes: 'As premissas de cálculo foram documentadas para a validação do cenário.',
      status: 'draft',
      items: [{ kind: 'archetype', templateId: archetype.id, quantity: 1 }],
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects whitespace-only estimate fields even when called outside the HTTP pipe', async () => {
    const { service } = createService();

    await expect(service.create('user-1', {
      title: '   ',
      clientName: '   ',
      scopeBoundary: ' '.repeat(40),
      calculationNotes: ' '.repeat(30),
      status: 'draft',
      items: [{ kind: 'archetype', templateId: archetype.id, quantity: 1 }],
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes estimate details to the authenticated user', async () => {
    const { prisma, service } = createService();
    prisma.estimate.findFirst.mockResolvedValue(null);

    await expect(service.findOne('user-1', 'estimate-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.estimate.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'estimate-1', userId: 'user-1' },
    }));
  });

  it('marks an owned estimate as sent and sets its first sent timestamp', async () => {
    const { prisma, service } = createService();
    prisma.estimate.findFirst.mockResolvedValue({ id: 'estimate-1', sentAt: null });
    prisma.estimate.update.mockImplementation(async ({ data }: { data: any }) => data);

    const result = await service.updateStatus('user-1', 'estimate-1', 'sent');

    expect(result.status).toBe('sent');
    expect(result.sentAt).toBeInstanceOf(Date);
  });
});
