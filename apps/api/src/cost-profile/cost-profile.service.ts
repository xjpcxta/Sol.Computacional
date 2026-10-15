import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCostProfileDto } from './dto/update-cost-profile.dto';

@Injectable()
export class CostProfileService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const effective = await this.findEffectiveByUserId(userId);
    return effective;
  }

  private async findOrCreateUserProfile(userId: string) {
    let profile = await this.prisma.costProfile.findUnique({
      where: { userId },
    });
    
    // If no profile exists for some reason, create a default one
    if (!profile) {
      profile = await this.prisma.costProfile.create({
        data: {
          userId,
          hourlyRate: 150,
          hoursPerPf: 10,
          riskMargin: 15,
          profitMarkup: 0,
          taxRate: 0,
        }
      });
    }
    
    return profile;
  }

  private async findOrCreateGlobalProfile() {
    return this.prisma.globalCostProfile.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        isActive: false,
        hourlyRate: 150,
        hoursPerPf: 10,
        riskMargin: 15,
        profitMarkup: 0,
        taxRate: 0,
      },
    });
  }

  async findEffectiveByUserId(userId: string) {
    const [userProfile, globalProfile] = await Promise.all([
      this.findOrCreateUserProfile(userId),
      this.findOrCreateGlobalProfile(),
    ]);
    const source = globalProfile.isActive ? globalProfile : userProfile;
    return {
      ...source,
      source: globalProfile.isActive ? 'global' as const : 'user' as const,
    };
  }

  async getSettings(userId: string, role: string) {
    const [userProfile, globalProfile] = await Promise.all([
      this.findOrCreateUserProfile(userId),
      this.findOrCreateGlobalProfile(),
    ]);
    const source = globalProfile.isActive ? globalProfile : userProfile;
    return {
      userProfile,
      globalProfile,
      effectiveProfile: {
        hourlyRate: source.hourlyRate,
        hoursPerPf: source.hoursPerPf,
        riskMargin: source.riskMargin,
        profitMarkup: source.profitMarkup,
        taxRate: source.taxRate,
        source: globalProfile.isActive ? 'global' as const : 'user' as const,
      },
      canManageGlobal: role === 'admin' || role === 'super_admin',
    };
  }

  async update(userId: string, data: UpdateCostProfileDto) {
    await this.findOrCreateUserProfile(userId);
    return this.prisma.costProfile.update({
      where: { userId },
      data,
    });
  }

  async updateGlobal(data: {
    isActive: boolean;
    hourlyRate: number;
    hoursPerPf: number;
    riskMargin: number;
    profitMarkup: number;
    taxRate: number;
  }) {
    return this.prisma.globalCostProfile.upsert({
      where: { id: 'global' },
      update: data,
      create: { id: 'global', ...data },
    });
  }
}
