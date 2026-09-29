import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CreateTemplateComponentDto } from '../../templates/dto/create-template.dto';
import { ESTIMATE_PRESET_KEYS } from '../estimate-presets';

const ESTIMATE_ITEM_KINDS = ['archetype', 'custom'] as const;
const ESTIMATE_STATUSES = ['draft', 'sent'] as const;

export class CreateEstimateItemDto {
  @IsIn(ESTIMATE_ITEM_KINDS)
  kind!: (typeof ESTIMATE_ITEM_KINDS)[number];

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @ValidateIf((item: CreateEstimateItemDto) => item.kind === 'archetype')
  @IsUUID()
  templateId?: string;

  @ValidateIf((item: CreateEstimateItemDto) => item.kind === 'custom')
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(3, 100)
  name?: string;

  @ValidateIf((item: CreateEstimateItemDto) => item.kind === 'custom')
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(30, 600)
  description?: string;

  @ValidateIf((item: CreateEstimateItemDto) => item.kind === 'custom')
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateComponentDto)
  components?: CreateTemplateComponentDto[];
}

export class CreateEstimateDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(3, 120)
  title!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(2, 120)
  clientName!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(30, 2000)
  scopeBoundary!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(20, 3000)
  calculationNotes!: string;

  @IsOptional()
  @IsIn(ESTIMATE_PRESET_KEYS)
  presetKey?: (typeof ESTIMATE_PRESET_KEYS)[number];

  @IsIn(ESTIMATE_STATUSES)
  status!: (typeof ESTIMATE_STATUSES)[number];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateEstimateItemDto)
  items!: CreateEstimateItemDto[];
}
