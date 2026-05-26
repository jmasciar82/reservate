import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getStats(
    @Query('clubId') clubId: string,
    @Query('range') range: string,
  ) {
    return this.analyticsService.getStats(clubId, range || '30d');
  }
}
