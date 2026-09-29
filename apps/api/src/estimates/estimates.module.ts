import { Module } from '@nestjs/common';
import { CostProfileModule } from '../cost-profile/cost-profile.module';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';

@Module({
  imports: [CostProfileModule],
  controllers: [EstimatesController],
  providers: [EstimatesService],
})
export class EstimatesModule {}
