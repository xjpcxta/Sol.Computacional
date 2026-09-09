import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { CostProfileService } from './cost-profile.service';
import { UpdateCostProfileDto } from './dto/update-cost-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cost-profile')
export class CostProfileController {
  constructor(private readonly costProfileService: CostProfileService) {}

  @Get()
  async getProfile(@Request() req: any) {
    return this.costProfileService.findByUserId(req.user.id);
  }

  @Put()
  async updateProfile(@Request() req: any, @Body() updateDto: UpdateCostProfileDto) {
    return this.costProfileService.update(req.user.id, updateDto);
  }
}
