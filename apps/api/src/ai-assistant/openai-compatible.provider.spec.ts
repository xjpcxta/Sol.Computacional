import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AiAssistantConfig } from '../config/environment';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';

const config: AiAssistantConfig = {
  enabled: true,
  apiUrl: 'https://provider.example/v1/chat/completions',
  apiKey: 'secret-server-key',
  model: 'fast-model',
  timeoutMs: 30_000,
  maxOutputTokens: 1_200,
  maxHistoryMessages: 10,
};

const request = {
  systemPrompt: 'System policy',
  userPrompt: 'Project data',
  maxOutputTokens: 1_200,
  requestId: 'request-id',
};

describe('OpenAiCompatibleProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('sends the compatible chat completion request and normalizes usage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: 'resolved-model',
      choices: [{ message: { content: '  Resposta útil.  ' } }],
      usage: { prompt_tokens: 42, completion_tokens: 17 },
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await new OpenAiCompatibleProvider(config).complete(request);

    expect(result).toEqual({
      content: 'Resposta útil.',
      model: 'resolved-model',
      inputTokens: 42,
      outputTokens: 17,
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'fast-model',
      max_tokens: 1_200,
      stream: false,
    });
    expect((init.headers as Record<string, string>).Authorization)
      .toBe('Bearer secret-server-key');
  });

  it.each([
    [401, 'unauthorized'],
    [429, 'rate_limited'],
    [500, 'unavailable'],
  ] as const)('maps status %s without exposing the secret', async (status, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('sensitive body', { status })));

    const promise = new OpenAiCompatibleProvider(config).complete(request);
    await expect(promise).rejects.toMatchObject({ code });
    await expect(promise).rejects.not.toThrow('secret-server-key');
  });

  it('rejects an empty completion', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '   ' } }],
    }), { status: 200 })));

    await expect(new OpenAiCompatibleProvider(config).complete(request))
      .rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('aborts after the configured timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    })));
    const provider = new OpenAiCompatibleProvider({ ...config, timeoutMs: 5_000 });
    const completion = provider.complete(request);
    const expectation = expect(completion).rejects.toMatchObject({ code: 'timeout' });

    await vi.advanceTimersByTimeAsync(5_000);

    await expectation;
  });
});
