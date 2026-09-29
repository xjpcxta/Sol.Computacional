import { IsIn } from 'class-validator';

export class UpdateEstimateStatusDto {
  @IsIn(['draft', 'sent'])
  status!: 'draft' | 'sent';
}
