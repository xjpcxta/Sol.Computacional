import { AiAssistantConfig } from '../config/environment';
import {
  AiProvider,
  AiProviderError,
  AiProviderRequest,
  AiProviderResult,
} from './ai-provider';

interface CompatibleCompletionResponse {
  model?: unknown;
  choices?: Array<{
    message?: { content?: unknown };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
  };
}

export class OpenAiCompatibleProvider extends AiProvider {
  constructor(private readonly config: AiAssistantConfig) {
    super();
  }

  async complete(request: AiProviderRequest): Promise<AiProviderResult> {
    if (
      !this.config.enabled
      || !this.config.apiUrl
      || !this.config.apiKey
      || !this.config.model
    ) {
      throw new AiProviderError('unavailable');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-Request-Id': request.requestId,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
          max_tokens: request.maxOutputTokens,
          temperature: 0.2,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AiProviderError('unauthorized');
        }
        if (response.status === 429) {
          throw new AiProviderError('rate_limited');
        }
        throw new AiProviderError('unavailable');
      }

      let payload: CompatibleCompletionResponse;
      try {
        payload = await response.json() as CompatibleCompletionResponse;
      } catch {
        throw new AiProviderError('invalid_response');
      }

      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new AiProviderError('invalid_response');
      }

      return {
        content: content.trim(),
        model: typeof payload.model === 'string' ? payload.model : this.config.model,
        ...(typeof payload.usage?.prompt_tokens === 'number'
          ? { inputTokens: payload.usage.prompt_tokens }
          : {}),
        ...(typeof payload.usage?.completion_tokens === 'number'
          ? { outputTokens: payload.usage.completion_tokens }
          : {}),
      };
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AiProviderError('timeout');
      }
      throw new AiProviderError('unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }
}
