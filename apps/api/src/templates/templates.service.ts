import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const templates = await this.prisma.template.findMany();
    return templates.map(t => ({
      ...t,
      totalPf: t.pfAli + t.pfAie + t.pfEe + t.pfSe + t.pfCe
    }));
  }

  async findOne(id: string) {
    const t = await this.prisma.template.findUnique({ where: { id } });
    if (!t) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return {
      ...t,
      totalPf: t.pfAli + t.pfAie + t.pfEe + t.pfSe + t.pfCe
    };
  }
}
