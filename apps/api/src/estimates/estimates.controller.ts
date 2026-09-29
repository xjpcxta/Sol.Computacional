import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { ListEstimatesDto } from './dto/list-estimates.dto';
import { UpdateEstimateStatusDto } from './dto/update-estimate-status.dto';
import { EstimatesService } from './estimates.service';

@UseGuards(JwtAuthGuard)
@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Get('configuration')
  getConfiguration() {
    return this.estimatesService.getConfiguration();
  }

  @Post()
  create(@Request() request: any, @Body() createEstimateDto: CreateEstimateDto) {
    return this.estimatesService.create(request.user.id, createEstimateDto);
  }

  @Get()
  findAll(@Request() request: any, @Query() query: ListEstimatesDto) {
    return this.estimatesService.findAll(request.user.id, query);
  }

  @Get(':id')
  findOne(@Request() request: any, @Param('id') id: string) {
    return this.estimatesService.findOne(request.user.id, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Request() request: any,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateEstimateStatusDto,
  ) {
    return this.estimatesService.updateStatus(request.user.id, id, updateStatusDto.status);
  }
}
