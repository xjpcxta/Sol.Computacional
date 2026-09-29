import {
  Complexity,
  EstimateItemKind,
  FunctionType,
  type CostProfile,
  type FunctionPointWeightMatrix,
  type Template,
} from '@pricefunc/shared';

export interface BoardComponent {
  key: string;
  name: string;
  description: string;
  functionType: FunctionType;
  complexity: Complexity;
  quantity: number;
  unitPf?: number;
}

export interface BoardItem {
  key: string;
  kind: EstimateItemKind;
  templateId?: string;
  name: string;
  description: string;
  quantity: number;
  components: BoardComponent[];
}

export interface BoardTotals {
  totalPf: number;
  estimatedHours: number;
  baseCost: number;
  riskAmount: number;
  totalPrice: number;
}

export function templateToBoardItem(template: Template): BoardItem {
  return {
    key: `template:${template.id}`,
    kind: EstimateItemKind.ARCHETYPE,
    templateId: template.id,
    name: template.name,
    description: template.description,
    quantity: 1,
    components: template.components.map((component) => ({
      key: component.id,
      name: component.name,
      description: component.description,
      functionType: component.functionType,
      complexity: component.complexity,
      quantity: component.quantity,
      unitPf: component.unitPf,
    })),
  };
}

export function applyPresetToBoard(
  currentItems: readonly BoardItem[],
  templateIds: readonly string[],
  templates: readonly Template[],
): BoardItem[] {
  const customItems = currentItems.filter((item) => item.kind === EstimateItemKind.CUSTOM);
  const templatesById = new Map(templates.map((template) => [template.id, template]));
  const missingIds = templateIds.filter((id) => !templatesById.has(id));
  if (missingIds.length > 0) {
    throw new Error('A configuração inicial referencia arquétipos indisponíveis.');
  }
  const archetypes = templateIds.map((id) => templateToBoardItem(templatesById.get(id)!));

  return [...archetypes, ...customItems];
}

export function getBoardComponentPf(
  component: BoardComponent,
  itemQuantity: number,
  weights: FunctionPointWeightMatrix,
): number {
  const unitPf = component.unitPf
    ?? weights[component.functionType][component.complexity];
  return unitPf * component.quantity * itemQuantity;
}

export function getBoardItemPf(
  item: BoardItem,
  weights: FunctionPointWeightMatrix,
): number {
  return item.components.reduce(
    (sum, component) => sum + getBoardComponentPf(component, item.quantity, weights),
    0,
  );
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateBoardTotals(
  items: readonly BoardItem[],
  weights: FunctionPointWeightMatrix,
  profile: Pick<CostProfile, 'hourlyRate' | 'hoursPerPf' | 'riskMargin'>,
): BoardTotals {
  const totalPf = items.reduce((sum, item) => sum + getBoardItemPf(item, weights), 0);
  const estimatedHours = totalPf * profile.hoursPerPf;
  const baseCost = roundCurrency(estimatedHours * profile.hourlyRate);
  const riskAmount = roundCurrency(baseCost * profile.riskMargin / 100);

  return {
    totalPf,
    estimatedHours,
    baseCost,
    riskAmount,
    totalPrice: roundCurrency(baseCost + riskAmount),
  };
}

export const EMPTY_WEIGHT_MATRIX: FunctionPointWeightMatrix = {
  [FunctionType.ALI]: {
    [Complexity.LOW]: 0,
    [Complexity.MEDIUM]: 0,
    [Complexity.HIGH]: 0,
  },
  [FunctionType.AIE]: {
    [Complexity.LOW]: 0,
    [Complexity.MEDIUM]: 0,
    [Complexity.HIGH]: 0,
  },
  [FunctionType.EE]: {
    [Complexity.LOW]: 0,
    [Complexity.MEDIUM]: 0,
    [Complexity.HIGH]: 0,
  },
  [FunctionType.SE]: {
    [Complexity.LOW]: 0,
    [Complexity.MEDIUM]: 0,
    [Complexity.HIGH]: 0,
  },
  [FunctionType.CE]: {
    [Complexity.LOW]: 0,
    [Complexity.MEDIUM]: 0,
    [Complexity.HIGH]: 0,
  },
};
