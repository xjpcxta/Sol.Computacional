import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { EstimateAssistantIntent } from '@pricefunc/shared';
import { EstimateAssistantMessageDto } from './estimate-assistant-message.dto';

describe('EstimateAssistantMessageDto', () => {
  it('rejects a request without the mandatory project context', async () => {
    const dto = plainToInstance(EstimateAssistantMessageDto, {
      intent: EstimateAssistantIntent.CHAT,
      message: 'O que falta?',
      history: [],
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('context');
  });

  it('accepts project and detailed scope without a client name', async () => {
    const dto = plainToInstance(EstimateAssistantMessageDto, {
      intent: EstimateAssistantIntent.CHAT,
      message: 'O que falta?',
      context: {
        projectTitle: 'Portal B2B',
        scopeBoundary: 'x'.repeat(120),
        calculationNotes: '',
        boardItems: [],
        catalogItems: [],
      },
      history: [],
    });

    expect(await validate(dto)).toEqual([]);
  });
});
