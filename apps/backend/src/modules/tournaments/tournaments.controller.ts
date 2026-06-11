import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { RegisterTeamDto } from './dto/register-team.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDto: CreateTournamentDto) {
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
  ) {
    return this.tournamentsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
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
  ) {
    return this.tournamentsService.updateTeam(id, teamId, updateTeamDto);
  }

  @Delete(':id/teams/:teamId')
  @UseGuards(JwtAuthGuard)
  async removeTeam(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
  ) {
    return this.tournamentsService.removeTeam(id, teamId);
  }

  @Post(':id/update-match')
  @UseGuards(JwtAuthGuard)
  async updateMatch(
    @Param('id') id: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ) {
    return this.tournamentsService.updateMatch(id, updateMatchDto);
  }

  @Post(':id/shuffle-groups')
  @UseGuards(JwtAuthGuard)
  async shuffleGroupMatches(@Param('id') id: string) {
    return this.tournamentsService.shuffleGroupMatches(id);
  }

  @Post(':id/advance-playoffs')
  @UseGuards(JwtAuthGuard)
  async advanceToPlayoffs(
    @Param('id') id: string,
  ) {
    return this.tournamentsService.advanceToPlayoffs(id);
  }
}
