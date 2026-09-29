import { describe, expect, it } from 'vitest';
import {
  calculateCommercialTotals,
  calculateComponentPf,
  calculateFunctionPointTotals,
  FUNCTION_POINT_WEIGHTS,
} from './function-point-calculator';

describe('function point calculator', () => {
  it('exposes the classic IFPUG low, medium and high weights', () => {
    expect(FUNCTION_POINT_WEIGHTS).toEqual({
      ALI: { low: 7, medium: 10, high: 15 },
      AIE: { low: 5, medium: 7, high: 10 },
      EE: { low: 3, medium: 4, high: 6 },
      SE: { low: 4, medium: 5, high: 7 },
      CE: { low: 3, medium: 4, high: 6 },
    });
  });

  it('multiplies a component weight by its quantity', () => {
    expect(calculateComponentPf({
      functionType: 'ALI',
      complexity: 'high',
      quantity: 2,
    })).toBe(30);
  });

  it('aggregates weighted points by function type', () => {
    expect(calculateFunctionPointTotals([
      { functionType: 'ALI', complexity: 'medium', quantity: 1 },
      { functionType: 'AIE', complexity: 'low', quantity: 2 },
      { functionType: 'EE', complexity: 'high', quantity: 1 },
      { functionType: 'SE', complexity: 'medium', quantity: 2 },
      { functionType: 'CE', complexity: 'low', quantity: 1 },
    ])).toEqual({
      pfAli: 10,
      pfAie: 10,
      pfEe: 6,
      pfSe: 10,
      pfCe: 3,
      totalPf: 39,
    });
  });

  it('calculates hours, base cost, risk and final price', () => {
    expect(calculateCommercialTotals(39, 150, 10, 15)).toEqual({
      totalPf: 39,
      estimatedHours: 390,
      baseCost: 58_500,
      riskAmount: 8_775,
      totalPrice: 67_275,
    });
  });
});
