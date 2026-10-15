import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { COMPLEXITIES, FUNCTION_TYPES } from '../../estimates/function-point-calculator';

const TEMPLATE_CATEGORIES = [
  'frontend',
  'backend',
  'integration',
  'infrastructure',
  'security',
  'reporting',
] as const;
const CALCULATION_BASES = ['function-points', 'service-hours'] as const;

export class CreateTemplateComponentDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(3, 100)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(30, 600)
  description!: string;

  @IsIn(FUNCTION_TYPES)
  functionType!: (typeof FUNCTION_TYPES)[number];

  @IsIn(COMPLEXITIES)
  complexity!: (typeof COMPLEXITIES)[number];

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class CreateTemplateDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(3, 80)
  name!: string;

  @IsIn(TEMPLATE_CATEGORIES)
  category!: (typeof TEMPLATE_CATEGORIES)[number];

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(20, 400)
  description!: string;

  @IsIn(CALCULATION_BASES)
  @IsOptional()
  calculationBasis?: (typeof CALCULATION_BASES)[number];

  @ValidateIf((value: CreateTemplateDto) => value.calculationBasis !== 'service-hours')
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateComponentDto)
  components?: CreateTemplateComponentDto[];

  @ValidateIf((value: CreateTemplateDto) => value.calculationBasis === 'service-hours')
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateServiceActivityDto)
  serviceActivities?: CreateTemplateServiceActivityDto[];
}

export class CreateTemplateServiceActivityDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(3, 100)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(30, 600)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.25)
  @Max(10000)
  estimatedHours!: number;
}
