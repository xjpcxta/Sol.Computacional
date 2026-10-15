export const ESTIMATE_PRESETS = [
  {
    key: 'complete-software',
    name: 'Software completo',
    description: 'Base ampla com todos os arquétipos disponíveis para um produto de ponta a ponta.',
    templateNames: [
      'Landing Page',
      'Autenticação',
      'CRUD Simples',
      'CRUD Complexo',
      'API REST Integração',
      'Dashboard com Gráficos',
      'Relatório PDF',
      'Upload de Arquivos',
    ],
  },
  {
    key: 'mvp',
    name: 'MVP',
    description: 'Núcleo enxuto para validar o produto com acesso, operação principal e indicadores.',
    templateNames: [
      'Landing Page',
      'Autenticação',
      'CRUD Simples',
      'Dashboard com Gráficos',
    ],
  },
  {
    key: 'sales-software',
    name: 'Software de vendas',
    description: 'Fluxo comercial com segurança, operação transacional, integração e apresentação gerencial.',
    templateNames: [
      'Autenticação',
      'CRUD Complexo',
      'API REST Integração',
      'Dashboard com Gráficos',
      'Relatório PDF',
    ],
  },
  {
    key: 'legacy-integration',
    name: 'Integração com legado',
    description: 'Modernização orientada à interoperabilidade, troca de dados e documentação dos resultados.',
    templateNames: [
      'Autenticação',
      'CRUD Complexo',
      'API REST Integração',
      'Relatório PDF',
      'Upload de Arquivos',
    ],
  },
  {
    key: 'landing-page',
    name: 'Landing page',
    description: 'Presença digital objetiva para apresentar a oferta e captar contatos.',
    templateNames: ['Landing Page'],
  },
  {
    key: 'risk-assessment',
    name: 'Avaliação de riscos',
    description: 'Revisão independente do software, com diagnóstico e relatório, sem obrigação de implementação.',
    templateNames: ['Avaliação de Riscos'],
  },
] as const;

export const ESTIMATE_PRESET_KEYS = ESTIMATE_PRESETS.map((preset) => preset.key);
