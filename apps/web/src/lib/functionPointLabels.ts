import { Complexity, FunctionType, TemplateCategory } from '@pricefunc/shared';

export const functionTypeLabels: Record<FunctionType, string> = {
  [FunctionType.ALI]: 'ALI · Arquivo lógico interno',
  [FunctionType.AIE]: 'AIE · Arquivo de interface externa',
  [FunctionType.EE]: 'EE · Entrada externa',
  [FunctionType.SE]: 'SE · Saída externa',
  [FunctionType.CE]: 'CE · Consulta externa',
};

export const complexityLabels: Record<Complexity, string> = {
  [Complexity.LOW]: 'Baixa',
  [Complexity.MEDIUM]: 'Média',
  [Complexity.HIGH]: 'Alta',
};

export const categoryLabels: Record<TemplateCategory, string> = {
  [TemplateCategory.FRONTEND]: 'Frontend',
  [TemplateCategory.BACKEND]: 'Backend',
  [TemplateCategory.INTEGRATION]: 'Integração',
  [TemplateCategory.INFRASTRUCTURE]: 'Infraestrutura',
  [TemplateCategory.SECURITY]: 'Segurança',
  [TemplateCategory.REPORTING]: 'Relatórios',
};
