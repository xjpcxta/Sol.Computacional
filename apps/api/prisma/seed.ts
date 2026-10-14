import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { getAdminSeedConfig, rootEnvPath } from '../src/config/environment';
import {
  calculateFunctionPointTotals,
  getFunctionPointWeight,
  type ComplexityValue,
  type FunctionTypeValue,
} from '../src/estimates/function-point-calculator';

config({ path: rootEnvPath, override: false, quiet: true });

const prisma = new PrismaClient();
const PASSWORD_HASH_ROUNDS = 12;

interface SeedComponent {
  name: string;
  description: string;
  functionType: FunctionTypeValue;
  complexity: ComplexityValue;
  quantity: number;
}

interface SeedTemplate {
  name: string;
  category: string;
  description: string;
  components: SeedComponent[];
}

const templates: SeedTemplate[] = [
  {
    name: 'Landing Page',
    category: 'frontend',
    description: 'Captação e apresentação institucional com conteúdo administrável e contato.',
    components: [
      {
        name: 'Conteúdo institucional',
        description: 'Mantém páginas, seções e chamadas comerciais reconhecidas pelo responsável de marketing.',
        functionType: 'ALI', complexity: 'low', quantity: 1,
      },
      {
        name: 'Cadastro de contato',
        description: 'Recebe e valida os dados enviados pelo visitante no formulário principal de contato.',
        functionType: 'EE', complexity: 'low', quantity: 1,
      },
      {
        name: 'Apresentação da página',
        description: 'Entrega ao visitante o conteúdo institucional composto para a campanha selecionada.',
        functionType: 'SE', complexity: 'medium', quantity: 1,
      },
      {
        name: 'Consulta de confirmação',
        description: 'Consulta o protocolo do contato sem executar cálculos ou transformações adicionais.',
        functionType: 'CE', complexity: 'low', quantity: 1,
      },
    ],
  },
  {
    name: 'Autenticação',
    category: 'security',
    description: 'Identidade, acesso, recuperação de credenciais e controle de sessão do usuário.',
    components: [
      {
        name: 'Contas de usuário',
        description: 'Mantém identidade, credenciais protegidas, situação e perfil de acesso de cada usuário.',
        functionType: 'ALI', complexity: 'medium', quantity: 1,
      },
      {
        name: 'Entrada de credenciais',
        description: 'Recebe credenciais, aplica validações de acesso e inicia uma sessão autenticada.',
        functionType: 'EE', complexity: 'medium', quantity: 1,
      },
      {
        name: 'Recuperação de acesso',
        description: 'Recebe a solicitação de recuperação e atualiza a credencial após validação do token.',
        functionType: 'EE', complexity: 'medium', quantity: 1,
      },
      {
        name: 'Resposta de autenticação',
        description: 'Produz a resposta de acesso com token, permissões e informações seguras da sessão.',
        functionType: 'SE', complexity: 'medium', quantity: 1,
      },
      {
        name: 'Consulta de sessão',
        description: 'Consulta a identidade e a validade da sessão atual sem manter novos dados funcionais.',
        functionType: 'CE', complexity: 'low', quantity: 1,
      },
    ],
  },
  {
    name: 'CRUD Simples',
    category: 'backend',
    description: 'Manutenção completa de um cadastro de negócio com regras diretas e consulta paginada.',
    components: [
      {
        name: 'Cadastro principal',
        description: 'Mantém o grupo lógico de dados reconhecido pelo usuário como o cadastro principal.',
        functionType: 'ALI', complexity: 'medium', quantity: 1,
      },
      {
        name: 'Inclusão e alteração',
        description: 'Recebe dados para incluir ou alterar o cadastro, aplicando as validações de negócio.',
        functionType: 'EE', complexity: 'medium', quantity: 2,
      },
      {
        name: 'Exclusão controlada',
        description: 'Recebe o comando de exclusão e verifica as restrições antes de retirar o registro.',
        functionType: 'EE', complexity: 'low', quantity: 1,
      },
      {
        name: 'Consulta do cadastro',
        description: 'Lista e detalha registros por filtros simples sem dados derivados ou processamento adicional.',
        functionType: 'CE', complexity: 'medium', quantity: 1,
      },
    ],
  },
  {
    name: 'CRUD Complexo',
    category: 'backend',
    description: 'Domínio transacional com múltiplas entidades, regras, estados e saídas derivadas.',
    components: [
      {
        name: 'Dados transacionais',
        description: 'Mantém entidades relacionadas, histórico de estados e regras de integridade do domínio.',
        functionType: 'ALI', complexity: 'high', quantity: 1,
      },
      {
        name: 'Dados externos de referência',
        description: 'Referencia informações mantidas por outra aplicação necessárias às validações do domínio.',
        functionType: 'AIE', complexity: 'medium', quantity: 1,
      },
      {
        name: 'Operações transacionais',
        description: 'Recebe inclusões, alterações e transições de estado com regras de negócio relacionadas.',
        functionType: 'EE', complexity: 'high', quantity: 3,
      },
      {
        name: 'Resumo calculado',
        description: 'Produz visão derivada com consolidação de dados e indicadores do processo transacional.',
        functionType: 'SE', complexity: 'high', quantity: 1,
      },
      {
        name: 'Pesquisa avançada',
        description: 'Consulta dados relacionados por filtros combinados sem atualizar arquivos lógicos.',
        functionType: 'CE', complexity: 'high', quantity: 1,
      },
    ],
  },
  {
    name: 'API REST Integração',
    category: 'integration',
    description: 'Integração bidirecional com serviço externo, transformação e consulta de dados.',
    components: [
      {
        name: 'Contrato de dados externo',
        description: 'Referencia a estrutura lógica mantida pelo sistema integrado e usada pela aplicação local.',
        functionType: 'AIE', complexity: 'medium', quantity: 1,
      },
      {
        name: 'Recepção de comandos',
        description: 'Recebe comandos externos, valida o contrato e mantém dados sob responsabilidade local.',
        functionType: 'EE', complexity: 'medium', quantity: 2,
      },
      {
        name: 'Resposta transformada',
        description: 'Entrega dados ao sistema consumidor após composição, conversão e aplicação das regras.',
        functionType: 'SE', complexity: 'high', quantity: 1,
      },
      {
        name: 'Consulta integrada',
        description: 'Consulta dados externos e devolve a resposta sem manter informações funcionais locais.',
        functionType: 'CE', complexity: 'medium', quantity: 1,
      },
    ],
  },
  {
    name: 'Dashboard com Gráficos',
    category: 'frontend',
    description: 'Painel analítico com indicadores, filtros, consolidações e visualizações gráficas.',
    components: [
      {
        name: 'Preferências do painel',
        description: 'Mantém filtros salvos, organização e preferências de visualização de cada usuário.',
        functionType: 'ALI', complexity: 'low', quantity: 1,
      },
      {
        name: 'Fontes analíticas externas',
        description: 'Referencia conjuntos de dados mantidos por sistemas externos para compor os indicadores.',
        functionType: 'AIE', complexity: 'high', quantity: 2,
      },
      {
        name: 'Indicadores calculados',
        description: 'Produz cartões e gráficos com agregações, fórmulas e comparações de períodos selecionados.',
        functionType: 'SE', complexity: 'high', quantity: 3,
      },
      {
        name: 'Filtros analíticos',
        description: 'Consulta recortes dos dados por filtros informados sem alterar os arquivos de origem.',
        functionType: 'CE', complexity: 'medium', quantity: 2,
      },
    ],
  },
  {
    name: 'Relatório PDF',
    category: 'reporting',
    description: 'Relatório formal com seleção de dados, composição, totais e documento exportável.',
    components: [
      {
        name: 'Configurações do relatório',
        description: 'Mantém modelos, parâmetros padrão e preferências reconhecidas pelo emissor do relatório.',
        functionType: 'ALI', complexity: 'low', quantity: 1,
      },
      {
        name: 'Dados de referência',
        description: 'Referencia informações mantidas externamente que precisam constar no documento final.',
        functionType: 'AIE', complexity: 'low', quantity: 1,
      },
      {
        name: 'Solicitação de emissão',
        description: 'Recebe período, filtros e formato escolhidos para iniciar a geração do documento.',
        functionType: 'EE', complexity: 'low', quantity: 1,
      },
      {
        name: 'Documento calculado',
        description: 'Produz o documento com agrupamentos, totais, paginação e apresentação pronta para envio.',
        functionType: 'SE', complexity: 'high', quantity: 2,
      },
    ],
  },
  {
    name: 'Upload de Arquivos',
    category: 'infrastructure',
    description: 'Recepção, validação, armazenamento e consulta de arquivos vinculados ao negócio.',
    components: [
      {
        name: 'Repositório de documentos',
        description: 'Mantém metadados, vínculo funcional, situação e localização dos documentos recebidos.',
        functionType: 'ALI', complexity: 'high', quantity: 1,
      },
      {
        name: 'Envio e validação',
        description: 'Recebe o arquivo, valida limites e formato e registra o documento no processo de negócio.',
        functionType: 'EE', complexity: 'high', quantity: 1,
      },
      {
        name: 'Resultado do processamento',
        description: 'Produz o resultado da validação com protocolo, alertas e estado final do processamento.',
        functionType: 'SE', complexity: 'low', quantity: 1,
      },
      {
        name: 'Consulta de documentos',
        description: 'Lista documentos e seus metadados por vínculo sem alterar os dados armazenados.',
        functionType: 'CE', complexity: 'low', quantity: 1,
      },
    ],
  },
];

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

  for (const template of templates) {
    const totals = calculateFunctionPointTotals(template.components);
    const componentData = template.components.map((component) => {
      const unitPf = getFunctionPointWeight(component.functionType, component.complexity);

      return {
        ...component,
        unitPf,
        totalPf: unitPf * component.quantity,
      };
    });

    await prisma.template.upsert({
      where: { name: template.name },
      update: {},
      create: {
        name: template.name,
        category: template.category,
        description: template.description,
        pfAli: totals.pfAli,
        pfAie: totals.pfAie,
        pfEe: totals.pfEe,
        pfSe: totals.pfSe,
        pfCe: totals.pfCe,
        components: {
          create: componentData,
        },
      },
    });
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
