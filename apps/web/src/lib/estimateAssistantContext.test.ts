import { describe, expect, it } from 'vitest';
import {
  Complexity,
  EstimateItemKind,
  FunctionType,
  TemplateCalculationBasis,
  TemplateCategory,
  type Template,
} from '@pricefunc/shared';
import type { BoardItem } from './estimateMath';
import { buildEstimateAssistantContext } from './estimateAssistantContext';

describe('buildEstimateAssistantContext', () => {
  it('maps useful project data without client, database ids, or prices', () => {
    const item: BoardItem = {
      key: 'private-board-key',
      templateId: 'private-template-id',
      kind: EstimateItemKind.ARCHETYPE,
      name: 'Autenticação',
      description: 'Acesso do usuário.',
      calculationBasis: TemplateCalculationBasis.FUNCTION_POINTS,
      quantity: 1,
      components: [{
        key: 'private-component-key',
        name: 'Login',
        description: 'Entrada de credenciais.',
        functionType: FunctionType.EE,
        complexity: Complexity.LOW,
        quantity: 1,
        unitPf: 3,
      }],
      serviceActivities: [],
    };
    const template = {
      id: 'private-template-id',
      name: 'Autenticação',
      description: 'Acesso do usuário.',
      calculationBasis: TemplateCalculationBasis.FUNCTION_POINTS,
      category: TemplateCategory.SECURITY,
      components: [],
      serviceActivities: [],
    } as unknown as Template;

    const context = buildEstimateAssistantContext({
      title: '  Portal B2B  ',
      scopeBoundary: '  Escopo detalhado  ',
      calculationNotes: '  Premissas  ',
      items: [item],
      templates: [template],
    });

    expect(context.projectTitle).toBe('Portal B2B');
    expect(context.boardItems[0]).not.toHaveProperty('key');
    expect(context.boardItems[0].components[0]).not.toHaveProperty('unitPf');
    expect(JSON.stringify(context)).not.toContain('private-');
    expect(context).not.toHaveProperty('clientName');
  });
});
