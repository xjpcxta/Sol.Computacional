import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListEstimatesDto {
  @IsOptional()
  @IsIn(['draft', 'sent'])
  status?: 'draft' | 'sent';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
