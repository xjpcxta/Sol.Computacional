import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { CostProfileService } from './cost-profile.service';
import { UpdateCostProfileDto } from './dto/update-cost-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateGlobalCostProfileDto } from './dto/update-global-cost-profile.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('cost-profile')
export class CostProfileController {
  constructor(private readonly costProfileService: CostProfileService) {}

  @Get()
  async getProfile(@Request() req: any) {
    return this.costProfileService.findByUserId(req.user.id);
  }

  @Get('settings')
  async getSettings(@Request() req: any) {
    return this.costProfileService.getSettings(req.user.id, req.user.role);
  }

  @Put('user')
  async updateProfile(@Request() req: any, @Body() updateDto: UpdateCostProfileDto) {
    return this.costProfileService.update(req.user.id, updateDto);
  }

  @Put('global')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async updateGlobal(@Body() updateDto: UpdateGlobalCostProfileDto) {
    return this.costProfileService.updateGlobal(updateDto);
  }
}
