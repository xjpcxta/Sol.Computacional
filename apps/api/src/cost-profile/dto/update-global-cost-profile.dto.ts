import { IsBoolean, IsNumber, Max, Min } from 'class-validator';

export class UpdateGlobalCostProfileDto {
  @IsBoolean()
  isActive!: boolean;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  hourlyRate!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  hoursPerPf!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  riskMargin!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  profitMarkup!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxRate!: number;
}
