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

  it('accepts detailed service activities without requiring function-point components', () => {
    const dto = plainToInstance(CreateTemplateDto, {
      name: 'Avaliação técnica',
      category: 'security',
      description: 'Avaliação consultiva independente com relatório técnico priorizado.',
      calculationBasis: 'service-hours',
      serviceActivities: [{
        name: 'Diagnóstico documentado',
        description: 'Analisa evidências técnicas e documenta os achados com impacto e prioridade.',
        estimatedHours: 12,
      }],
    });

    expect(validateSync(dto)).toEqual([]);
  });

  it('requires service activities when the hourly-service basis is selected', () => {
    const dto = plainToInstance(CreateTemplateDto, {
      name: 'Avaliação técnica',
      category: 'security',
      description: 'Avaliação consultiva independente com relatório técnico priorizado.',
      calculationBasis: 'service-hours',
      serviceActivities: [],
    });

    expect(validateSync(dto).map((error) => error.property)).toContain('serviceActivities');
  });
});
