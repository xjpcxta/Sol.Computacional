import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateEstimateDto } from './create-estimate.dto';

describe('CreateEstimateDto', () => {
  it('trims project and custom-function strings before validation', () => {
    const dto = plainToInstance(CreateEstimateDto, {
      title: '   ',
      clientName: '   ',
      scopeBoundary: ' '.repeat(40),
      calculationNotes: ' '.repeat(30),
      status: 'draft',
      items: [{
        kind: 'custom',
        quantity: 1,
        name: '   ',
        description: ' '.repeat(40),
        components: [{
          name: '   ',
          description: ' '.repeat(40),
          functionType: 'EE',
          complexity: 'medium',
          quantity: 1,
        }],
      }],
    });

    const errors = validateSync(dto);

    expect(dto.title).toBe('');
    expect(dto.items[0].name).toBe('');
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining([
      'title',
      'clientName',
      'scopeBoundary',
      'calculationNotes',
      'items',
    ]));
  });
});
