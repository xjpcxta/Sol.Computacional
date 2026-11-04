import { describe, expect, it } from 'vitest';
import {
  Complexity,
  EstimateAssistantIntent,
  FunctionType,
  type EstimateAssistantChatMessage,
  type EstimateAssistantContext,
} from '@pricefunc/shared';
import {
  buildEstimateAssistantPayload,
  buildRequestHistory,
  MAX_HISTORY_MESSAGE_LENGTH,
  type EstimateAssistantUiMessage,
} from './useEstimateAssistant';

const sampleContext: EstimateAssistantContext = {
  projectTitle: 'Portal B2B',
  scopeBoundary: 'x'.repeat(140),
  calculationNotes: 'Premissas iniciais.',
  boardItems: [],
  catalogItems: [],
};

describe('useEstimateAssistant payload & history helpers', () => {
  it('sends an empty history for the 3 structured area actions even after long assistant replies', () => {
    const existingConversation: EstimateAssistantUiMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Ajude a redigir as premissas desta estimativa.',
        intent: EstimateAssistantIntent.PREMISES_DRAFT,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'p'.repeat(2_850),
        intent: EstimateAssistantIntent.PREMISES_DRAFT,
      },
    ];

    const customFunctionPayload = buildEstimateAssistantPayload(
      {
        intent: EstimateAssistantIntent.CUSTOM_FUNCTION_REVIEW,
        visibleMessage: 'Analise a funcionalidade personalizada “Aprovação”.',
        customFunction: {
          name: 'Aprovação',
          description: 'Recebe a decisão do aprovador e atualiza o pedido.',
          functionType: FunctionType.EE,
          complexity: Complexity.MEDIUM,
          quantity: 1,
        },
      },
      sampleContext,
      existingConversation,
      10,
    );

    expect(customFunctionPayload.history).toEqual([]);
    expect(customFunctionPayload.customFunction?.name).toBe('Aprovação');

    const boardReviewPayload = buildEstimateAssistantPayload(
      {
        intent: EstimateAssistantIntent.BOARD_REVIEW,
        visibleMessage: 'Analise a lousa atual e identifique possíveis lacunas.',
      },
      sampleContext,
      [
        ...existingConversation,
        {
          id: 'msg-3',
          role: 'assistant',
          content: 'r'.repeat(4_800),
          intent: EstimateAssistantIntent.CUSTOM_FUNCTION_REVIEW,
        },
      ],
      10,
    );

    expect(boardReviewPayload.history).toEqual([]);
  });

  it('truncates oversized assistant replies to 2000 characters when sending follow-up chat messages', () => {
    const messages: EstimateAssistantChatMessage[] = [
      { role: 'user', content: 'Analise a lousa atual.' },
      { role: 'assistant', content: 'a'.repeat(4_500) },
    ];

    const payload = buildEstimateAssistantPayload(
      {
        intent: EstimateAssistantIntent.CHAT,
        visibleMessage: 'Pode detalhar a primeira lacuna?',
        message: 'Pode detalhar a primeira lacuna?',
      },
      sampleContext,
      messages,
      10,
    );

    expect(payload.history).toHaveLength(2);
    expect(payload.history[0].content).toBe('Analise a lousa atual.');
    expect(payload.history[1].content).toHaveLength(MAX_HISTORY_MESSAGE_LENGTH);
  });

  it('preserves baseMessages on retry without duplicating the failed user prompt in history', () => {
    const baseMessages: EstimateAssistantUiMessage[] = [
      { id: '1', role: 'user', content: 'Pergunta inicial' },
      { id: '2', role: 'assistant', content: 'Resposta inicial' },
    ];
    const failedAction = {
      intent: EstimateAssistantIntent.CHAT,
      visibleMessage: 'Segunda pergunta que falhou na rede',
      message: 'Segunda pergunta que falhou na rede',
    };

    const firstAttemptPayload = buildEstimateAssistantPayload(
      failedAction,
      sampleContext,
      baseMessages,
      10,
    );
    const retryPayload = buildEstimateAssistantPayload(
      failedAction,
      sampleContext,
      baseMessages,
      10,
    );

    expect(retryPayload).toEqual(firstAttemptPayload);
    expect(retryPayload.history.map((item) => item.content)).not.toContain(
      'Segunda pergunta que falhou na rede',
    );
  });

  it('respects the configured history limit and filters blank messages', () => {
    const messages: EstimateAssistantChatMessage[] = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `mensagem-${index}`,
    }));

    const history = buildRequestHistory(
      [...messages, { role: 'user', content: '   ' }],
      EstimateAssistantIntent.CHAT,
      10,
    );

    expect(history).toHaveLength(10);
    expect(history[0].content).toBe('mensagem-2');
    expect(history[9].content).toBe('mensagem-11');
  });
});
