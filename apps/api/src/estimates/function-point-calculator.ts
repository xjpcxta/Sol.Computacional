export const FUNCTION_TYPES = ['ALI', 'AIE', 'EE', 'SE', 'CE'] as const;
export const COMPLEXITIES = ['low', 'medium', 'high'] as const;

export type FunctionTypeValue = (typeof FUNCTION_TYPES)[number];
export type ComplexityValue = (typeof COMPLEXITIES)[number];

export type FunctionPointWeightMatrix = Record<
  FunctionTypeValue,
  Record<ComplexityValue, number>
>;

export const FUNCTION_POINT_WEIGHTS: FunctionPointWeightMatrix = {
  ALI: { low: 7, medium: 10, high: 15 },
  AIE: { low: 5, medium: 7, high: 10 },
  EE: { low: 3, medium: 4, high: 6 },
  SE: { low: 4, medium: 5, high: 7 },
  CE: { low: 3, medium: 4, high: 6 },
};

export interface CalculableComponent {
  functionType: FunctionTypeValue;
  complexity: ComplexityValue;
  quantity: number;
}

export interface FunctionPointTotals {
  pfAli: number;
  pfAie: number;
  pfEe: number;
  pfSe: number;
  pfCe: number;
  totalPf: number;
}

export interface CommercialTotals {
  totalPf: number;
  estimatedHours: number;
  baseCost: number;
  riskAmount: number;
  totalPrice: number;
}

export function getFunctionPointWeight(
  functionType: FunctionTypeValue,
  complexity: ComplexityValue,
): number {
  return FUNCTION_POINT_WEIGHTS[functionType][complexity];
}

export function calculateComponentPf(component: CalculableComponent): number {
  return getFunctionPointWeight(component.functionType, component.complexity)
    * component.quantity;
}

export function calculateFunctionPointTotals(
  components: readonly CalculableComponent[],
): FunctionPointTotals {
  const totals: FunctionPointTotals = {
    pfAli: 0,
    pfAie: 0,
    pfEe: 0,
    pfSe: 0,
    pfCe: 0,
    totalPf: 0,
  };

  for (const component of components) {
    const total = calculateComponentPf(component);

    if (component.functionType === 'ALI') totals.pfAli += total;
    if (component.functionType === 'AIE') totals.pfAie += total;
    if (component.functionType === 'EE') totals.pfEe += total;
    if (component.functionType === 'SE') totals.pfSe += total;
    if (component.functionType === 'CE') totals.pfCe += total;

    totals.totalPf += total;
  }

  return totals;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateCommercialTotals(
  totalPf: number,
  hourlyRate: number,
  hoursPerPf: number,
  riskMargin: number,
): CommercialTotals {
  const estimatedHours = totalPf * hoursPerPf;
  const baseCost = roundCurrency(estimatedHours * hourlyRate);
  const riskAmount = roundCurrency(baseCost * (riskMargin / 100));

  return {
    totalPf,
    estimatedHours,
    baseCost,
    riskAmount,
    totalPrice: roundCurrency(baseCost + riskAmount),
  };
}
