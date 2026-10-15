import { Module } from '@nestjs/common';
import { CostProfileService } from './cost-profile.service';
import { CostProfileController } from './cost-profile.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  providers: [CostProfileService, RolesGuard],
  controllers: [CostProfileController],
  exports: [CostProfileService],
})
export class CostProfileModule {}
