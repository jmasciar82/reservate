import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { ClubsService } from '../clubs/clubs.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { RegisterTeamDto } from './dto/register-team.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly clubsService: ClubsService,
  ) {}

  private async verifyAccess(clubId: string | undefined, user: any) {
    if (user.role === 'admin') return;
    if (!clubId) {
      throw new ForbiddenException('No tienes permisos para acceder a este torneo.');
    }
    if (user.role === 'club_owner') {
      const club = await this.clubsService.findOne(clubId);
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permiso para acceder a este torneo.');
      }
    } else if (user.role === 'staff') {
      if (clubId !== user.clubId) {
        throw new ForbiddenException('No tienes permiso para acceder a este torneo.');
      }
    } else {
      throw new ForbiddenException('No tienes permiso para realizar esta acción.');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDto: CreateTournamentDto, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    if (user.role === 'club_owner') {
      if (!createDto.clubId) {
        throw new BadRequestException('El clubId es requerido.');
      }
      const club = await this.clubsService.findOne(createDto.clubId);
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('El club indicado no pertenece a tu franquicia.');
      }
    } else if (user.role === 'staff') {
      createDto.clubId = user.clubId;
    }

    if (!createDto.clubId) {
      throw new BadRequestException('El clubId es requerido.');
    }
    return this.tournamentsService.create(createDto);
  }

  @Get()
  async findAll(@Query('clubId') clubId: string) {
    return this.tournamentsService.findAll(clubId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Get(':id/standings')
  async getStandings(@Param('id') id: string): Promise<any> {
    return this.tournamentsService.getStandings(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTournamentDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const tournament = await this.tournamentsService.findOne(id);
    await this.verifyAccess(tournament.clubId?.toString(), user);

    return this.tournamentsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const tournament = await this.tournamentsService.findOne(id);
    await this.verifyAccess(tournament.clubId?.toString(), user);

    return this.tournamentsService.remove(id);
  }

  @Post(':id/register-team')
  async registerTeam(
    @Param('id') id: string,
    @Body() registerTeamDto: RegisterTeamDto,
  ) {
    return this.tournamentsService.registerTeam(id, registerTeamDto);
  }

  @Patch(':id/teams/:teamId')
  @UseGuards(JwtAuthGuard)
  async updateTeam(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const tournament = await this.tournamentsService.findOne(id);
    await this.verifyAccess(tournament.clubId?.toString(), user);

    return this.tournamentsService.updateTeam(id, teamId, updateTeamDto);
  }

  @Delete(':id/teams/:teamId')
  @UseGuards(JwtAuthGuard)
  async removeTeam(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const tournament = await this.tournamentsService.findOne(id);
    await this.verifyAccess(tournament.clubId?.toString(), user);

    return this.tournamentsService.removeTeam(id, teamId);
  }

  @Post(':id/update-match')
  @UseGuards(JwtAuthGuard)
  async updateMatch(
    @Param('id') id: string,
    @Body() updateMatchDto: UpdateMatchDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const tournament = await this.tournamentsService.findOne(id);
    await this.verifyAccess(tournament.clubId?.toString(), user);

    return this.tournamentsService.updateMatch(id, updateMatchDto);
  }

  @Post(':id/shuffle-groups')
  @UseGuards(JwtAuthGuard)
  async shuffleGroupMatches(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const tournament = await this.tournamentsService.findOne(id);
    await this.verifyAccess(tournament.clubId?.toString(), user);

    return this.tournamentsService.shuffleGroupMatches(id);
  }

  @Post(':id/advance-playoffs')
  @UseGuards(JwtAuthGuard)
  async advanceToPlayoffs(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    const tournament = await this.tournamentsService.findOne(id);
    await this.verifyAccess(tournament.clubId?.toString(), user);

    return this.tournamentsService.advanceToPlayoffs(id);
  }
}
