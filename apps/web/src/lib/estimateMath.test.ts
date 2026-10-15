import { describe, expect, it } from 'vitest';
import {
  Complexity,
  EstimateItemKind,
  FunctionType,
  TemplateCalculationBasis,
  type FunctionPointWeightMatrix,
  type Template,
} from '@pricefunc/shared';
import {
  applyPresetToBoard,
  calculateBoardTotals,
  getBoardItemPf,
  templateToBoardItem,
  type BoardItem,
} from './estimateMath';

const weights: FunctionPointWeightMatrix = {
  [FunctionType.ALI]: { low: 7, medium: 10, high: 15 },
  [FunctionType.AIE]: { low: 5, medium: 7, high: 10 },
  [FunctionType.EE]: { low: 3, medium: 4, high: 6 },
  [FunctionType.SE]: { low: 4, medium: 5, high: 7 },
  [FunctionType.CE]: { low: 3, medium: 4, high: 6 },
};

const template = {
  id: 'template-1',
  name: 'Cadastro',
  description: 'Cadastro de exemplo',
  calculationBasis: TemplateCalculationBasis.FUNCTION_POINTS,
  serviceActivities: [],
  components: [{
    id: 'component-1',
    templateId: 'template-1',
    name: 'Dados',
    description: 'Dados detalhados do cadastro',
    functionType: FunctionType.ALI,
    complexity: Complexity.MEDIUM,
    quantity: 1,
    unitPf: 10,
    totalPf: 10,
    createdAt: '',
    updatedAt: '',
  }],
} as unknown as Template;

describe('estimate board math', () => {
  it('converts a catalog template into a selectable board item', () => {
    expect(templateToBoardItem(template)).toMatchObject({
      key: 'template:template-1',
      kind: EstimateItemKind.ARCHETYPE,
      templateId: 'template-1',
      quantity: 1,
    });
  });

  it('replaces the complete board when applying a preset', () => {
    const custom: BoardItem = {
      key: 'custom-1',
      kind: EstimateItemKind.CUSTOM,
      name: 'Regra especial',
      description: 'Regra exclusiva do cliente',
      quantity: 1,
      calculationBasis: TemplateCalculationBasis.FUNCTION_POINTS,
      components: [],
      serviceActivities: [],
    };

    expect(applyPresetToBoard([custom], ['template-1'], [template])).toEqual([
      expect.objectContaining({ templateId: 'template-1' }),
    ]);
  });

  it('rejects an incomplete preset instead of silently dropping archetypes', () => {
    expect(() => applyPresetToBoard([], ['missing-template'], [template]))
      .toThrow('A configuração inicial referencia arquétipos indisponíveis.');
  });

  it('multiplies component and item quantities', () => {
    const item = templateToBoardItem(template);
    item.quantity = 3;
    item.components[0].quantity = 2;

    expect(getBoardItemPf(item, weights)).toBe(60);
  });

  it('calculates the same commercial formula used by the API', () => {
    const item = templateToBoardItem(template);
    expect(calculateBoardTotals([item], weights, {
      hourlyRate: 150,
      hoursPerPf: 10,
      riskMargin: 15,
      profitMarkup: 0,
      taxRate: 0,
    })).toEqual({
      totalPf: 10,
      functionPointHours: 100,
      serviceHours: 0,
      estimatedHours: 100,
      baseCost: 15_000,
      riskAmount: 2_250,
      profitAmount: 0,
      taxAmount: 0,
      totalPrice: 17_250,
    });
  });

  it('includes hourly services and commercial additions', () => {
    const serviceTemplate = {
      ...template,
      id: 'service-1',
      calculationBasis: TemplateCalculationBasis.SERVICE_HOURS,
      components: [],
      serviceActivities: [{
        id: 'activity-1',
        templateId: 'service-1',
        name: 'Diagnóstico',
        description: 'Diagnóstico técnico detalhado do produto avaliado.',
        estimatedHours: 20,
        createdAt: '',
        updatedAt: '',
      }],
    } as Template;
    expect(calculateBoardTotals([templateToBoardItem(serviceTemplate)], weights, {
      hourlyRate: 100,
      hoursPerPf: 10,
      riskMargin: 10,
      profitMarkup: 20,
      taxRate: 10,
    })).toMatchObject({
      totalPf: 0,
      serviceHours: 20,
      totalPrice: 2904,
    });
  });
});
