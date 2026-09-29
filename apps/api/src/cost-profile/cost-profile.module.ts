import { Module } from '@nestjs/common';
import { CostProfileService } from './cost-profile.service';
import { CostProfileController } from './cost-profile.controller';

@Module({
  providers: [CostProfileService],
  controllers: [CostProfileController],
  exports: [CostProfileService],
})
export class CostProfileModule {}
