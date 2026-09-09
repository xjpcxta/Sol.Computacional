import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCostProfileDto } from './dto/update-cost-profile.dto';

@Injectable()
export class CostProfileService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
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
        }
      });
    }
    
    return profile;
  }

  async update(userId: string, data: UpdateCostProfileDto) {
    return this.prisma.costProfile.update({
      where: { userId },
      data,
    });
  }
}
