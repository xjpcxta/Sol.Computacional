import { Module } from '@nestjs/common';
import { getAiAssistantConfig } from '../config/environment';
import { AiProvider } from './ai-provider';
import { AiAssistantController } from './ai-assistant.controller';
import {
  AI_ASSISTANT_CONFIG,
  EstimateAssistantService,
} from './estimate-assistant.service';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';

@Module({
  controllers: [AiAssistantController],
  providers: [
    {
      provide: AI_ASSISTANT_CONFIG,
      useFactory: () => getAiAssistantConfig(process.env),
    },
    {
      provide: AiProvider,
      useFactory: (config: ReturnType<typeof getAiAssistantConfig>) => (
        new OpenAiCompatibleProvider(config)
      ),
      inject: [AI_ASSISTANT_CONFIG],
    },
    EstimateAssistantService,
  ],
})
export class AiAssistantModule {}
