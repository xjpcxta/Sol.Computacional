import { describe, expect, it } from 'vitest';
import { getAssistantEligibility } from './estimateAssistantEligibility';

describe('getAssistantEligibility', () => {
  it('requires the project title without requiring a client name', () => {
    expect(getAssistantEligibility({
      title: '',
      scopeBoundary: 'x'.repeat(120),
      boardItemCount: 1,
    })).toMatchObject({
      canUseAssistant: false,
      missingField: 'title',
    });
  });

  it('requires a detailed scope', () => {
    expect(getAssistantEligibility({
      title: 'Portal B2B',
      scopeBoundary: 'x'.repeat(119),
      boardItemCount: 1,
    })).toMatchObject({
      canUseAssistant: false,
      missingField: 'scope',
    });
  });

  it('allows chat before the board has items but blocks board review', () => {
    expect(getAssistantEligibility({
      title: 'Portal B2B',
      scopeBoundary: 'x'.repeat(120),
      boardItemCount: 0,
    })).toMatchObject({
      canUseAssistant: true,
      canReviewBoard: false,
      missingField: 'board',
    });
  });

  it('enables every workflow with complete context and a board item', () => {
    expect(getAssistantEligibility({
      title: 'Portal B2B',
      scopeBoundary: 'x'.repeat(120),
      boardItemCount: 2,
    })).toEqual({ canUseAssistant: true, canReviewBoard: true });
  });
});
