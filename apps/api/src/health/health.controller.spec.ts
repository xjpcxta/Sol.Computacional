import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports that the API and database are healthy', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
    } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'reachable',
    });
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });
});
