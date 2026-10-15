import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { CostProfileService } from './cost-profile.service';

const userProfile = {
  id: 'user-profile',
  userId: 'user-1',
  hourlyRate: 120,
  hoursPerPf: 8,
  riskMargin: 10,
  profitMarkup: 15,
  taxRate: 6,
};

const globalProfile = {
  id: 'global',
  isActive: false,
  hourlyRate: 180,
  hoursPerPf: 12,
  riskMargin: 20,
  profitMarkup: 25,
  taxRate: 9,
};

function createService() {
  const prisma = {
    costProfile: {
      findUnique: vi.fn().mockResolvedValue(userProfile),
      create: vi.fn(),
      update: vi.fn(),
    },
    globalCostProfile: {
      upsert: vi.fn().mockResolvedValue(globalProfile),
    },
  };

  return {
    prisma,
    service: new CostProfileService(prisma as unknown as PrismaService),
  };
}

describe('CostProfileService', () => {
  it('uses every user value when the global profile is inactive', async () => {
    const { service } = createService();

    await expect(service.findEffectiveByUserId('user-1')).resolves.toMatchObject({
      ...userProfile,
      source: 'user',
    });
  });

  it('replaces the complete user profile when the global profile is active', async () => {
    const { prisma, service } = createService();
    prisma.globalCostProfile.upsert.mockResolvedValue({ ...globalProfile, isActive: true });

    const result = await service.findEffectiveByUserId('user-1');

    expect(result).toMatchObject({
      hourlyRate: 180,
      hoursPerPf: 12,
      riskMargin: 20,
      profitMarkup: 25,
      taxRate: 9,
      source: 'global',
    });
    expect(result.hourlyRate).not.toBe(userProfile.hourlyRate);
  });

  it('creates a complete default user profile when one does not exist', async () => {
    const { prisma, service } = createService();
    prisma.costProfile.findUnique.mockResolvedValue(null);
    prisma.costProfile.create.mockImplementation(async ({ data }: { data: object }) => ({
      id: 'created-profile',
      ...data,
    }));

    const result = await service.findEffectiveByUserId('new-user');

    expect(prisma.costProfile.create).toHaveBeenCalledWith({
      data: {
        userId: 'new-user',
        hourlyRate: 150,
        hoursPerPf: 10,
        riskMargin: 15,
        profitMarkup: 0,
        taxRate: 0,
      },
    });
    expect(result).toMatchObject({ source: 'user', profitMarkup: 0, taxRate: 0 });
  });

  it('exposes global management only to administrator roles', async () => {
    const { service } = createService();

    const [userSettings, adminSettings, superAdminSettings] = await Promise.all([
      service.getSettings('user-1', 'user'),
      service.getSettings('user-1', 'admin'),
      service.getSettings('user-1', 'super_admin'),
    ]);

    expect(userSettings.canManageGlobal).toBe(false);
    expect(adminSettings.canManageGlobal).toBe(true);
    expect(superAdminSettings.canManageGlobal).toBe(true);
  });
});
