import { IsOptional, IsNumber } from 'class-validator';

export class UpdateCostProfileDto {
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  hoursPerPf?: number;

  @IsOptional()
  @IsNumber()
  riskMargin?: number;
}
