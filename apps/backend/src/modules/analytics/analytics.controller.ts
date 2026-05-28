import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
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
    @Request() req: any,
  ) {
    const user = req.user;
    let targetClubId = clubId;
    if (user.role === 'club_owner' || user.role === 'staff') {
      targetClubId = user.clubId;
    }
    return this.analyticsService.getStats(targetClubId, range || '30d');
  }
}
