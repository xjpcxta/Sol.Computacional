import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateTemplateDto } from './create-template.dto';

describe('CreateTemplateDto', () => {
  it('trims strings before enforcing audited-content lengths', () => {
    const dto = plainToInstance(CreateTemplateDto, {
      name: '   ',
      category: 'backend',
      description: ' '.repeat(30),
      components: [{
        name: '   ',
        description: ' '.repeat(40),
        functionType: 'ALI',
        complexity: 'low',
        quantity: 1,
      }],
    });

    const errors = validateSync(dto);

    expect(dto.name).toBe('');
    expect(dto.description).toBe('');
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining([
      'name',
      'description',
      'components',
    ]));
  });
});
