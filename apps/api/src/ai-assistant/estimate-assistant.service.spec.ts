import { describe, expect, it, vi } from 'vitest';
import {
  EstimateAssistantIntent,
  type EstimateAssistantRequest,
} from '@pricefunc/shared';
import type { AiAssistantConfig } from '../config/environment';
import { AiProvider, AiProviderError } from './ai-provider';
import { EstimateAssistantService } from './estimate-assistant.service';
import type { EstimateAssistantMessageDto } from './dto/estimate-assistant-message.dto';

const enabledConfig: AiAssistantConfig = {
  enabled: true,
  apiUrl: 'https://provider.example/v1/chat/completions',
  apiKey: 'secret-key',
  model: 'fast-model',
  timeoutMs: 30_000,
  maxOutputTokens: 1_200,
  maxHistoryMessages: 10,
};

function createDto(
  overrides: Partial<EstimateAssistantRequest> = {},
): EstimateAssistantMessageDto {
  return {
    intent: EstimateAssistantIntent.CHAT,
    message: 'O que falta confirmar?',
    context: {
      projectTitle: 'Portal B2B',
      scopeBoundary: 'Escopo funcional detalhado com atores, processos, entradas, saídas, integrações e exclusões conhecidas para esta estimativa.',
      calculationNotes: 'Premissa atual.',
      boardItems: [],
      catalogItems: [],
    },
    history: [],
    ...overrides,
  } as EstimateAssistantMessageDto;
}

function createProvider(result = 'Resposta assistida.') {
  return {
    complete: vi.fn().mockResolvedValue({
      content: result,
      model: 'fast-model',
      inputTokens: 10,
      outputTokens: 4,
    }),
  } as unknown as AiProvider;
}

describe('EstimateAssistantService', () => {
  it('returns ordinary chat text in a small transport envelope', async () => {
    const provider = createProvider();
    const service = new EstimateAssistantService(provider, enabledConfig);

    const response = await service.createMessage('user-id', createDto());

    expect(response).toMatchObject({
      message: 'Resposta assistida.',
      intent: EstimateAssistantIntent.CHAT,
    });
    expect(response.requestId).toEqual(expect.any(String));
    expect(provider.complete).toHaveBeenCalledOnce();
  });

  it('does not call the provider when the feature is disabled', async () => {
    const provider = createProvider();
    const service = new EstimateAssistantService(provider, {
      ...enabledConfig,
      enabled: false,
    });

    await expect(service.createMessage('user-id', createDto())).rejects.toMatchObject({
      status: 503,
    });
    expect(provider.complete).not.toHaveBeenCalled();
  });

  it('requires a board item for board review', async () => {
    const provider = createProvider();
    const service = new EstimateAssistantService(provider, enabledConfig);

    await expect(service.createMessage('user-id', createDto({
      intent: EstimateAssistantIntent.BOARD_REVIEW,
      message: undefined,
    }))).rejects.toMatchObject({ status: 400 });
    expect(provider.complete).not.toHaveBeenCalled();
  });

  it('maps provider timeout without exposing provider details', async () => {
    const provider = {
      complete: vi.fn().mockRejectedValue(new AiProviderError('timeout')),
    } as unknown as AiProvider;
    const service = new EstimateAssistantService(provider, enabledConfig);

    await expect(service.createMessage('user-id', createDto())).rejects.toMatchObject({
      status: 504,
    });
  });

  it('limits a premises response to the field capacity', async () => {
    const provider = createProvider('p'.repeat(3_500));
    const service = new EstimateAssistantService(provider, enabledConfig);

    const response = await service.createMessage('user-id', createDto({
      intent: EstimateAssistantIntent.PREMISES_DRAFT,
      message: undefined,
    }));

    expect(response.message).toHaveLength(3_000);
  });
});
