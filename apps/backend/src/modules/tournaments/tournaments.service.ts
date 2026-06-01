import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tournament, TournamentDocument, TournamentTeam, TournamentMatch } from './schemas/tournament.schema';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { RegisterTeamDto } from './dto/register-team.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectModel(Tournament.name) private tournamentModel: Model<TournamentDocument>,
  ) {}

  async create(createDto: CreateTournamentDto): Promise<TournamentDocument> {
    const created = new this.tournamentModel({
      ...createDto,
      clubId: new Types.ObjectId(createDto.clubId),
      teams: [],
      bracket: [],
    });
    return created.save();
  }

  async findAll(clubId: string): Promise<TournamentDocument[]> {
    if (!Types.ObjectId.isValid(clubId)) {
      return [];
    }
    return this.tournamentModel
      .find({ clubId: new Types.ObjectId(clubId) } as any)
      .sort({ startDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<TournamentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Torneo no encontrado');
    }
    const tournament = await this.tournamentModel.findById(id).exec();
    if (!tournament) {
      throw new NotFoundException('Torneo no encontrado');
    }
    return tournament;
  }

  async update(id: string, updateDto: UpdateTournamentDto): Promise<TournamentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Torneo no encontrado');
    }
    const updated = await this.tournamentModel
      .findByIdAndUpdate(id, { $set: updateDto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Torneo no encontrado');
    }
    return updated;
  }

  async registerTeam(id: string, registerTeamDto: RegisterTeamDto): Promise<TournamentDocument> {
    const tournament = await this.findOne(id);

    if (tournament.status !== 'registration') {
      throw new BadRequestException('El torneo no está en período de inscripciones.');
    }

    if (tournament.teams.length >= tournament.maxTeams) {
      throw new BadRequestException('El cupo de parejas para este torneo está completo.');
    }

    // Crear el nuevo equipo
    const newTeam: TournamentTeam = {
      _id: new Types.ObjectId() as any,
      name: registerTeamDto.name,
      player1: registerTeamDto.player1,
      player2: registerTeamDto.player2,
      registeredAt: new Date(),
    };

    tournament.teams.push(newTeam);

    // Si se completaron las parejas, generamos las llaves e iniciamos el torneo
    if (tournament.teams.length === tournament.maxTeams) {
      tournament.bracket = this.generateInitialBracket(tournament.teams, tournament.maxTeams);
      tournament.status = 'active';
    }

    // Marcar como modificado debido al array anidado de subdocumentos
    tournament.markModified('teams');
    if (tournament.teams.length === tournament.maxTeams) {
      tournament.markModified('bracket');
    }

    return tournament.save();
  }

  async updateMatch(id: string, updateMatchDto: UpdateMatchDto): Promise<TournamentDocument> {
    const tournament = await this.findOne(id);

    if (tournament.status !== 'active') {
      throw new BadRequestException('El torneo debe estar activo para modificar partidos.');
    }

    const matchIndex = tournament.bracket.findIndex(m => m.matchId === updateMatchDto.matchId);
    if (matchIndex === -1) {
      throw new NotFoundException('Partido no encontrado en el cuadro.');
    }

    const match = tournament.bracket[matchIndex];
    if (!match.teamA || !match.teamB) {
      throw new BadRequestException('No se pueden cargar resultados de un partido sin ambos equipos definidos.');
    }

    match.scoreA = updateMatchDto.scoreA;
    match.scoreB = updateMatchDto.scoreB;

    let winner: TournamentTeam;
    if (updateMatchDto.scoreA > updateMatchDto.scoreB) {
      winner = match.teamA;
      match.winnerId = (match.teamA._id as any).toString();
    } else if (updateMatchDto.scoreB > updateMatchDto.scoreA) {
      winner = match.teamB;
      match.winnerId = (match.teamB._id as any).toString();
    } else {
      throw new BadRequestException('Los partidos eliminatorios no pueden terminar en empate.');
    }

    // Avanzar de ronda al ganador si tiene un siguiente partido programado
    if (match.nextMatchId) {
      const nextMatchIndex = tournament.bracket.findIndex(m => m.matchId === match.nextMatchId);
      if (nextMatchIndex !== -1) {
        const nextMatch = tournament.bracket[nextMatchIndex];
        if (match.nextMatchSlot === 'A') {
          nextMatch.teamA = winner;
        } else {
          nextMatch.teamB = winner;
        }
      }
    } else {
      // Si no hay siguiente partido, es la gran final
      tournament.status = 'completed';
    }

    // Forzar actualización en Mongoose debido al nesting
    tournament.markModified('bracket');
    return tournament.save();
  }

  private generateInitialBracket(teams: TournamentTeam[], maxTeams: number): TournamentMatch[] {
    const bracket: TournamentMatch[] = [];

    if (maxTeams === 8) {
      // 4 partidos de Cuartos de final
      // Q-1, Q-2, Q-3, Q-4
      // S-1, S-2 (Semifinales)
      // F-1 (Final)

      // Ronda 1: Cuartos
      bracket.push({
        matchId: 'Q-1',
        teamA: teams[0] || null,
        teamB: teams[1] || null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-1', nextMatchSlot: 'A',
      });
      bracket.push({
        matchId: 'Q-2',
        teamA: teams[2] || null,
        teamB: teams[3] || null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-1', nextMatchSlot: 'B',
      });
      bracket.push({
        matchId: 'Q-3',
        teamA: teams[4] || null,
        teamB: teams[5] || null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-2', nextMatchSlot: 'A',
      });
      bracket.push({
        matchId: 'Q-4',
        teamA: teams[6] || null,
        teamB: teams[7] || null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-2', nextMatchSlot: 'B',
      });

      // Semifinales
      bracket.push({
        matchId: 'S-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'A',
      });
      bracket.push({
        matchId: 'S-2',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'B',
      });

      // Final
      bracket.push({
        matchId: 'F-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: null, nextMatchSlot: null,
      });

    } else if (maxTeams === 16) {
      // 8 partidos de Octavos de final: O-1 a O-8
      // 4 partidos de Cuartos de final: Q-1 a Q-4
      // 2 partidos de Semifinales: S-1 y S-2
      // 1 partido de Final: F-1

      // Ronda 1: Octavos
      for (let i = 0; i < 8; i++) {
        const nextQ = `Q-${Math.floor(i / 2) + 1}`;
        const slot = i % 2 === 0 ? 'A' : 'B';
        bracket.push({
          matchId: `O-${i + 1}`,
          teamA: teams[i * 2] || null,
          teamB: teams[i * 2 + 1] || null,
          scoreA: null, scoreB: null, winnerId: null,
          nextMatchId: nextQ, nextMatchSlot: slot,
        });
      }

      // Ronda 2: Cuartos
      for (let i = 0; i < 4; i++) {
        const nextS = `S-${Math.floor(i / 2) + 1}`;
        const slot = i % 2 === 0 ? 'A' : 'B';
        bracket.push({
          matchId: `Q-${i + 1}`,
          teamA: null, teamB: null,
          scoreA: null, scoreB: null, winnerId: null,
          nextMatchId: nextS, nextMatchSlot: slot,
        });
      }

      // Ronda 3: Semifinales
      bracket.push({
        matchId: 'S-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'A',
      });
      bracket.push({
        matchId: 'S-2',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'B',
      });

      // Final
      bracket.push({
        matchId: 'F-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: null, nextMatchSlot: null,
      });
    }

    return bracket;
  }
}
