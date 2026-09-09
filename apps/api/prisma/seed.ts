import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { getAdminSeedConfig, rootEnvPath } from '../src/config/environment';

config({ path: rootEnvPath, override: false, quiet: true });

const prisma = new PrismaClient();
const PASSWORD_HASH_ROUNDS = 12;

async function main() {
  const adminConfig = getAdminSeedConfig(process.env);
  const adminPassword = await bcrypt.hash(adminConfig.password, PASSWORD_HASH_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { username: adminConfig.username },
    update: {
      email: adminConfig.email,
      password: adminPassword,
      role: 'admin',
    },
    create: {
      username: adminConfig.username,
      email: adminConfig.email,
      password: adminPassword,
      role: 'admin',
    },
  });

  await prisma.costProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      hourlyRate: 150,
      hoursPerPf: 10,
      riskMargin: 15,
    },
  });

  const templates = [
    {
      name: 'Landing Page',
      category: 'frontend',
      description: 'Landing Page template',
      pfAli: 2, pfAie: 0, pfEe: 1, pfSe: 2, pfCe: 1,
    },
    {
      name: 'Autenticação',
      category: 'security',
      description: 'Authentication template',
      pfAli: 1, pfAie: 1, pfEe: 3, pfSe: 1, pfCe: 2,
    },
    {
      name: 'CRUD Simples',
      category: 'backend',
      description: 'Simple CRUD template',
      pfAli: 1, pfAie: 0, pfEe: 3, pfSe: 2, pfCe: 2,
    },
    {
      name: 'CRUD Complexo',
      category: 'backend',
      description: 'Complex CRUD template',
      pfAli: 2, pfAie: 1, pfEe: 5, pfSe: 3, pfCe: 3,
    },
    {
      name: 'API REST Integração',
      category: 'integration',
      description: 'REST API Integration template',
      pfAli: 1, pfAie: 2, pfEe: 4, pfSe: 3, pfCe: 2,
    },
    {
      name: 'Dashboard com Gráficos',
      category: 'frontend',
      description: 'Dashboard with Charts template',
      pfAli: 2, pfAie: 2, pfEe: 1, pfSe: 4, pfCe: 3,
    },
    {
      name: 'Relatório PDF',
      category: 'reporting',
      description: 'PDF Report template',
      pfAli: 1, pfAie: 1, pfEe: 1, pfSe: 3, pfCe: 1,
    },
    {
      name: 'Upload de Arquivos',
      category: 'infrastructure',
      description: 'File Upload template',
      pfAli: 1, pfAie: 0, pfEe: 2, pfSe: 1, pfCe: 1,
    }
  ];

  for (const t of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: t.name },
    });
    
    if (!existing) {
      await prisma.template.create({
        data: t,
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
