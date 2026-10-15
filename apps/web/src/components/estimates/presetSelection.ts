import type { EstimatePresetKey } from '@pricefunc/shared';

export function togglePreset(
  activePreset: EstimatePresetKey | null,
  requestedPreset: EstimatePresetKey,
): EstimatePresetKey | null {
  return activePreset === requestedPreset ? null : requestedPreset;
}

export function presetChangeNeedsConfirmation(boardItemCount: number): boolean {
  return boardItemCount > 0;
}
