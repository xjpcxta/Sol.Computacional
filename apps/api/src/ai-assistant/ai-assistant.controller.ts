import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type {
  EstimateAssistantConfiguration,
  EstimateAssistantResponse,
} from '@pricefunc/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EstimateAssistantMessageDto } from './dto/estimate-assistant-message.dto';
import { EstimateAssistantService } from './estimate-assistant.service';

@UseGuards(JwtAuthGuard)
@Controller('ai/estimate-assistant')
export class AiAssistantController {
  constructor(private readonly assistantService: EstimateAssistantService) {}

  @Get('configuration')
  getConfiguration(): EstimateAssistantConfiguration {
    return this.assistantService.getConfiguration();
  }

  @Post('messages')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  createMessage(
    @Request() request: { user: { id: string } },
    @Body() body: EstimateAssistantMessageDto,
  ): Promise<EstimateAssistantResponse> {
    return this.assistantService.createMessage(request.user.id, body);
  }
}
