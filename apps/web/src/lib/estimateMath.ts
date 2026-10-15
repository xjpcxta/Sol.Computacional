import {
  Complexity,
  EstimateItemKind,
  FunctionType,
  TemplateCalculationBasis,
  type CostProfileValues,
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
  calculationBasis: TemplateCalculationBasis;
  components: BoardComponent[];
  serviceActivities: Array<{
    key: string;
    name: string;
    description: string;
    estimatedHours: number;
  }>;
}

export interface BoardTotals {
  totalPf: number;
  functionPointHours: number;
  serviceHours: number;
  estimatedHours: number;
  baseCost: number;
  riskAmount: number;
  profitAmount: number;
  taxAmount: number;
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
    calculationBasis: template.calculationBasis,
    components: template.components.map((component) => ({
      key: component.id,
      name: component.name,
      description: component.description,
      functionType: component.functionType,
      complexity: component.complexity,
      quantity: component.quantity,
      unitPf: component.unitPf,
    })),
    serviceActivities: template.serviceActivities.map((activity) => ({
      key: activity.id,
      name: activity.name,
      description: activity.description,
      estimatedHours: activity.estimatedHours,
    })),
  };
}

export function applyPresetToBoard(
  _currentItems: readonly BoardItem[],
  templateIds: readonly string[],
  templates: readonly Template[],
): BoardItem[] {
  const templatesById = new Map(templates.map((template) => [template.id, template]));
  const missingIds = templateIds.filter((id) => !templatesById.has(id));
  if (missingIds.length > 0) {
    throw new Error('A configuração inicial referencia arquétipos indisponíveis.');
  }
  const archetypes = templateIds.map((id) => templateToBoardItem(templatesById.get(id)!));

  return archetypes;
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

export function getBoardItemServiceHours(item: BoardItem): number {
  return item.serviceActivities.reduce(
    (sum, activity) => sum + activity.estimatedHours * item.quantity,
    0,
  );
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateBoardTotals(
  items: readonly BoardItem[],
  weights: FunctionPointWeightMatrix,
  profile: CostProfileValues,
): BoardTotals {
  const totalPf = items.reduce((sum, item) => sum + getBoardItemPf(item, weights), 0);
  const serviceHours = items.reduce((sum, item) => sum + getBoardItemServiceHours(item), 0);

  return calculateCommercialTotals(totalPf, serviceHours, profile);
}

export function calculateCommercialTotals(
  totalPf: number,
  serviceHours: number,
  profile: CostProfileValues,
): BoardTotals {
  const functionPointHours = totalPf * profile.hoursPerPf;
  const estimatedHours = functionPointHours + serviceHours;
  const baseCost = roundCurrency(estimatedHours * profile.hourlyRate);
  const riskAmount = roundCurrency(baseCost * profile.riskMargin / 100);
  const profitBase = baseCost + riskAmount;
  const profitAmount = roundCurrency(profitBase * profile.profitMarkup / 100);
  const taxBase = profitBase + profitAmount;
  const taxAmount = roundCurrency(taxBase * profile.taxRate / 100);

  return {
    totalPf,
    functionPointHours,
    serviceHours,
    estimatedHours,
    baseCost,
    riskAmount,
    profitAmount,
    taxAmount,
    totalPrice: roundCurrency(taxBase + taxAmount),
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
