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
    },
  };

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
});
