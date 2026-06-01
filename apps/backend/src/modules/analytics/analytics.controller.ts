import { Controller, Get, Query, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ClubsService } from '../clubs/clubs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly clubsService: ClubsService,
  ) {}

  @Get()
  async getStats(
    @Query('clubId') clubId: string,
    @Query('range') range: string,
    @Request() req: any,
  ) {
    const user = req.user;
    let targetClubId = clubId;

    if (user.role === 'club_owner') {
      if (!clubId) {
        throw new BadRequestException('Debes indicar el clubId para consultar estadísticas.');
      }
      const club = await this.clubsService.findOne(clubId);
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permiso para consultar estadísticas de este club.');
      }
    } else if (user.role === 'staff') {
      targetClubId = user.clubId;
    }

    return this.analyticsService.getStats(targetClubId, range || '30d');
  }
}
