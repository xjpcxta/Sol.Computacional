import { EstimatePresetKey } from '@pricefunc/shared';
import { describe, expect, it } from 'vitest';
import { presetChangeNeedsConfirmation, togglePreset } from './presetSelection';

describe('preset selection', () => {
  it('deselects a preset when the selected option is requested again', () => {
    expect(togglePreset(EstimatePresetKey.MVP, EstimatePresetKey.MVP)).toBeNull();
  });

  it('switches to a different preset', () => {
    expect(togglePreset(EstimatePresetKey.MVP, EstimatePresetKey.LANDING_PAGE))
      .toBe(EstimatePresetKey.LANDING_PAGE);
  });

  it('requests confirmation only when the board has content', () => {
    expect(presetChangeNeedsConfirmation(3)).toBe(true);
    expect(presetChangeNeedsConfirmation(0)).toBe(false);
  });
});
