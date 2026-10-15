import {
  BadRequestException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  EstimateAssistantIntent,
  type EstimateAssistantConfiguration,
  type EstimateAssistantRequest,
  type EstimateAssistantResponse,
} from '@pricefunc/shared';
import type { AiAssistantConfig } from '../config/environment';
import { AiProvider, AiProviderError } from './ai-provider';
import { buildAssistantPrompt } from './estimate-assistant-prompts';
import type { EstimateAssistantMessageDto } from './dto/estimate-assistant-message.dto';

export const AI_ASSISTANT_CONFIG = Symbol('AI_ASSISTANT_CONFIG');

@Injectable()
export class EstimateAssistantService {
  private readonly logger = new Logger(EstimateAssistantService.name);

  constructor(
    private readonly provider: AiProvider,
    @Inject(AI_ASSISTANT_CONFIG) private readonly config: AiAssistantConfig,
  ) {}

  getConfiguration(): EstimateAssistantConfiguration {
    return {
      enabled: this.config.enabled,
      maxHistoryMessages: this.config.maxHistoryMessages,
    };
  }

  async createMessage(
    userId: string,
    dto: EstimateAssistantMessageDto,
  ): Promise<EstimateAssistantResponse> {
    if (!this.config.enabled) {
      throw new ServiceUnavailableException(
        'O assistente de IA ainda não está habilitado neste ambiente.',
      );
    }

    this.validateIntent(dto);
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const request = dto as EstimateAssistantRequest;

    try {
      const prompt = buildAssistantPrompt(request);
      const result = await this.provider.complete({
        ...prompt,
        maxOutputTokens: this.config.maxOutputTokens,
        requestId,
      });
      const responseLimit = dto.intent === EstimateAssistantIntent.PREMISES_DRAFT
        ? 3_000
        : 6_000;
      const message = result.content.trim().slice(0, responseLimit);
      if (!message) {
        throw new AiProviderError('invalid_response');
      }

      this.logger.log({
        requestId,
        userId,
        intent: dto.intent,
        latencyMs: Date.now() - startedAt,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        outcome: 'success',
      });

      return { message, requestId, intent: dto.intent };
    } catch (error) {
      this.logger.warn({
        requestId,
        userId,
        intent: dto.intent,
        latencyMs: Date.now() - startedAt,
        outcome: error instanceof AiProviderError ? error.code : 'failed',
      });

      if (error instanceof AiProviderError) {
        if (error.code === 'timeout') {
          throw new GatewayTimeoutException(
            'A análise levou mais tempo que o esperado. Tente novamente.',
          );
        }
        if (error.code === 'rate_limited') {
          throw new ServiceUnavailableException(
            'O provedor de IA está com muitas solicitações. Aguarde um momento e tente novamente.',
          );
        }
        throw new ServiceUnavailableException(
          'O assistente está temporariamente indisponível. Sua estimativa não foi alterada.',
        );
      }
      throw error;
    }
  }

  private validateIntent(dto: EstimateAssistantMessageDto) {
    if (!dto.context) {
      throw new BadRequestException(
        'Informe o projeto e o escopo detalhado antes de usar o assistente.',
      );
    }
    if (dto.intent === EstimateAssistantIntent.CHAT && !dto.message?.trim()) {
      throw new BadRequestException('Escreva uma mensagem para o assistente.');
    }
    if (
      dto.intent === EstimateAssistantIntent.CUSTOM_FUNCTION_REVIEW
      && (!dto.customFunction
        || (!dto.customFunction.name.trim() && !dto.customFunction.description.trim()))
    ) {
      throw new BadRequestException(
        'Preencha ao menos o nome ou a descrição da funcionalidade antes da análise.',
      );
    }
    if (
      dto.intent === EstimateAssistantIntent.BOARD_REVIEW
      && dto.context.boardItems.length === 0
    ) {
      throw new BadRequestException(
        'Coloque ao menos um item na lousa antes da análise.',
      );
    }
  }
}
