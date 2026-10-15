import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  Complexity,
  EstimateAssistantIntent,
  FunctionType,
  TemplateCalculationBasis,
} from '@pricefunc/shared';

const CHAT_ROLES = ['user', 'assistant'] as const;

class EstimateAssistantChatMessageDto {
  @IsIn(CHAT_ROLES)
  role!: (typeof CHAT_ROLES)[number];

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 2_000)
  content!: string;
}

class EstimateAssistantBoardComponentDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 160)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 1_200)
  description!: string;

  @IsEnum(FunctionType)
  functionType!: FunctionType;

  @IsEnum(Complexity)
  complexity!: Complexity;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

class EstimateAssistantServiceActivityDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 160)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 1_200)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100_000)
  estimatedHours!: number;
}

class EstimateAssistantBoardItemDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 160)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 1_200)
  description!: string;

  @IsEnum(TemplateCalculationBasis)
  calculationBasis!: TemplateCalculationBasis;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => EstimateAssistantBoardComponentDto)
  components!: EstimateAssistantBoardComponentDto[];

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => EstimateAssistantServiceActivityDto)
  serviceActivities!: EstimateAssistantServiceActivityDto[];
}

class EstimateAssistantCatalogItemDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 160)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 1_200)
  description!: string;

  @IsEnum(TemplateCalculationBasis)
  calculationBasis!: TemplateCalculationBasis;
}

class EstimateAssistantContextDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(3, 120)
  projectTitle!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(120, 2_000)
  scopeBoundary!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(3_000)
  calculationNotes!: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => EstimateAssistantBoardItemDto)
  boardItems!: EstimateAssistantBoardItemDto[];

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => EstimateAssistantCatalogItemDto)
  catalogItems!: EstimateAssistantCatalogItemDto[];
}

class EstimateAssistantCustomFunctionDraftDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(100)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(600)
  description!: string;

  @IsEnum(FunctionType)
  functionType!: FunctionType;

  @IsEnum(Complexity)
  complexity!: Complexity;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class EstimateAssistantMessageDto {
  @IsEnum(EstimateAssistantIntent)
  intent!: EstimateAssistantIntent;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  message?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => EstimateAssistantContextDto)
  context!: EstimateAssistantContextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EstimateAssistantCustomFunctionDraftDto)
  customFunction?: EstimateAssistantCustomFunctionDraftDto;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => EstimateAssistantChatMessageDto)
  history!: EstimateAssistantChatMessageDto[];
}
