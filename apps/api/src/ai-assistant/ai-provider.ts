export interface AiProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens: number;
  requestId: string;
}

export interface AiProviderResult {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
  model: string;
}

export type AiProviderErrorCode =
  | 'unauthorized'
  | 'rate_limited'
  | 'timeout'
  | 'unavailable'
  | 'invalid_response';

export class AiProviderError extends Error {
  constructor(public readonly code: AiProviderErrorCode) {
    super(`AI provider failure: ${code}`);
    this.name = 'AiProviderError';
  }
}

export abstract class AiProvider {
  abstract complete(request: AiProviderRequest): Promise<AiProviderResult>;
}
