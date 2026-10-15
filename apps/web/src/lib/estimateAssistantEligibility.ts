export const ESTIMATE_ASSISTANT_MINIMUM_SCOPE_LENGTH = 120;

export interface EstimateAssistantEligibilityInput {
  title: string;
  scopeBoundary: string;
  boardItemCount: number;
}

export interface EstimateAssistantEligibility {
  canUseAssistant: boolean;
  canReviewBoard: boolean;
  assistantDisabledReason?: string;
  boardDisabledReason?: string;
  missingField?: 'title' | 'scope' | 'board';
}

export function getAssistantEligibility(
  input: EstimateAssistantEligibilityInput,
): EstimateAssistantEligibility {
  if (input.title.trim().length < 3) {
    const reason = 'Informe o nome do projeto para contextualizar a análise.';
    return {
      canUseAssistant: false,
      canReviewBoard: false,
      assistantDisabledReason: reason,
      boardDisabledReason: reason,
      missingField: 'title',
    };
  }

  if (input.scopeBoundary.trim().length < ESTIMATE_ASSISTANT_MINIMUM_SCOPE_LENGTH) {
    const reason = `Detalhe o escopo em pelo menos ${ESTIMATE_ASSISTANT_MINIMUM_SCOPE_LENGTH} caracteres para usar a análise.`;
    return {
      canUseAssistant: false,
      canReviewBoard: false,
      assistantDisabledReason: reason,
      boardDisabledReason: reason,
      missingField: 'scope',
    };
  }

  if (input.boardItemCount === 0) {
    return {
      canUseAssistant: true,
      canReviewBoard: false,
      boardDisabledReason: 'Coloque ao menos um item na lousa antes de analisá-la.',
      missingField: 'board',
    };
  }

  return { canUseAssistant: true, canReviewBoard: true };
}
