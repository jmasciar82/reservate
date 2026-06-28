import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tournament, TournamentDocument, TournamentTeam, TournamentMatch, TournamentPlayer } from './schemas/tournament.schema';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { RegisterTeamDto } from './dto/register-team.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

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

  private validateDuplicatePlayers(tournament: TournamentDocument, registerTeamDto: RegisterTeamDto) {
    const p1Phone = registerTeamDto.player1.phone?.trim();
    const p1Email = registerTeamDto.player1.email?.trim()?.toLowerCase();
    const p2Phone = registerTeamDto.player2?.phone?.trim();
    const p2Email = registerTeamDto.player2?.email?.trim()?.toLowerCase();

    for (const team of tournament.teams) {
      const registeredPhones = [
        team.player1.phone?.trim(),
        team.player2?.phone?.trim(),
      ].filter(Boolean);
      const registeredEmails = [
        team.player1.email?.trim()?.toLowerCase(),
        team.player2?.email?.trim()?.toLowerCase(),
      ].filter(Boolean);

      if (
        (p1Phone && registeredPhones.includes(p1Phone)) ||
        (p2Phone && registeredPhones.includes(p2Phone)) ||
        (p1Email && registeredEmails.includes(p1Email)) ||
        (p2Email && registeredEmails.includes(p2Email))
      ) {
        throw new BadRequestException('Uno de los jugadores ya se encuentra inscrito en este torneo.');
      }
    }
  }

  private generateBracketAndActivate(tournament: TournamentDocument) {
    if (tournament.type === 'elimination') {
      tournament.bracket = this.generateInitialBracket(tournament.teams, tournament.maxTeams);
    } else if (tournament.type === 'round_robin') {
      tournament.bracket = this.generateRoundRobinMatches(tournament.teams, 'round_robin');
    } else if (tournament.type === 'americano') {
      tournament.bracket = this.generateAmericanoMatches(tournament.teams);
    } else if (tournament.type === 'groups_playoff') {
      // Asignar parejas a grupos (A/B para 8, A/B/C/D para 16)
      const groups: { [key: string]: TournamentTeam[] } = {};
      if (tournament.maxTeams === 8) {
        groups['A'] = [];
        groups['B'] = [];
        tournament.teams.forEach((t, i) => {
          const groupName = i % 2 === 0 ? 'A' : 'B';
          t.group = groupName;
          groups[groupName].push(t);
        });
      } else {
        groups['A'] = [];
        groups['B'] = [];
        groups['C'] = [];
        groups['D'] = [];
        tournament.teams.forEach((t, i) => {
          const groupNames = ['A', 'B', 'C', 'D'];
          const groupName = groupNames[i % 4];
          t.group = groupName;
          groups[groupName].push(t);
        });
      }

      // Generar partidos todos contra todos para cada grupo
      const allGroupMatches: TournamentMatch[] = [];
      Object.entries(groups).forEach(([groupName, groupTeams]) => {
        const groupMatches = this.generateRoundRobinMatches(groupTeams, 'groups');
        allGroupMatches.push(...groupMatches);
      });
      tournament.bracket = allGroupMatches;
    }
    tournament.status = 'active';
  }

  async registerTeam(id: string, registerTeamDto: RegisterTeamDto): Promise<TournamentDocument> {
    const session = await this.tournamentModel.db.startSession().catch(() => null);
    if (session) {
      session.startTransaction();
      try {
        const tournament = await this.tournamentModel.findById(id).session(session).exec();
        if (!tournament) {
          throw new NotFoundException('Torneo no encontrado');
        }

        if (tournament.status !== 'registration') {
          throw new BadRequestException('El torneo no está en período de inscripciones.');
        }

        if (tournament.teams.length >= tournament.maxTeams) {
          throw new BadRequestException('El cupo de parejas para este torneo está completo.');
        }

        this.validateDuplicatePlayers(tournament, registerTeamDto);

        const newTeam: TournamentTeam = {
          _id: new Types.ObjectId() as any,
          name: registerTeamDto.name,
          player1: registerTeamDto.player1,
          player2: registerTeamDto.player2 || registerTeamDto.player1,
          registeredAt: new Date(),
          paymentStatus: 'pending',
        };

        tournament.teams.push(newTeam);

        if (tournament.teams.length === tournament.maxTeams) {
          this.generateBracketAndActivate(tournament);
        }

        tournament.markModified('teams');
        if (tournament.teams.length === tournament.maxTeams) {
          tournament.markModified('bracket');
        }

        const saved = await tournament.save({ session });
        await session.commitTransaction();
        return saved;
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } else {
      // Fallback sin transacción
      const tournament = await this.findOne(id);

      if (tournament.status !== 'registration') {
        throw new BadRequestException('El torneo no está en período de inscripciones.');
      }

      if (tournament.teams.length >= tournament.maxTeams) {
        throw new BadRequestException('El cupo de parejas para este torneo está completo.');
      }

      this.validateDuplicatePlayers(tournament, registerTeamDto);

      const newTeam: TournamentTeam = {
        _id: new Types.ObjectId() as any,
        name: registerTeamDto.name,
        player1: registerTeamDto.player1,
        player2: registerTeamDto.player2 || registerTeamDto.player1,
        registeredAt: new Date(),
        paymentStatus: 'pending',
      };

      tournament.teams.push(newTeam);

      if (tournament.teams.length === tournament.maxTeams) {
        this.generateBracketAndActivate(tournament);
      }

      tournament.markModified('teams');
      if (tournament.teams.length === tournament.maxTeams) {
        tournament.markModified('bracket');
      }

      return tournament.save();
    }
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

    let winner: TournamentTeam;

    if (updateMatchDto.sets && updateMatchDto.sets.length > 0) {
      // Modo sets (pádel/tenis)
      match.sets = updateMatchDto.sets as any;
      let setsWonA = 0;
      let setsWonB = 0;
      for (const set of updateMatchDto.sets) {
        if (set.scoreA > set.scoreB) setsWonA++;
        else if (set.scoreB > set.scoreA) setsWonB++;
      }
      match.scoreA = setsWonA;
      match.scoreB = setsWonB;

      if (setsWonA > setsWonB) {
        winner = match.teamA;
        match.winnerId = (match.teamA._id as any).toString();
      } else if (setsWonB > setsWonA) {
        winner = match.teamB;
        match.winnerId = (match.teamB._id as any).toString();
      } else {
        throw new BadRequestException('Los partidos no pueden terminar en empate de sets.');
      }
    } else if (updateMatchDto.scoreA !== undefined && updateMatchDto.scoreB !== undefined) {
      // Modo puntos simples (americano)
      match.sets = [] as any;
      match.scoreA = updateMatchDto.scoreA;
      match.scoreB = updateMatchDto.scoreB;

      if (updateMatchDto.scoreA > updateMatchDto.scoreB) {
        winner = match.teamA;
        match.winnerId = (match.teamA._id as any).toString();
      } else if (updateMatchDto.scoreB > updateMatchDto.scoreA) {
        winner = match.teamB;
        match.winnerId = (match.teamB._id as any).toString();
      } else {
        throw new BadRequestException('Los partidos no pueden terminar en empate.');
      }
    } else {
      throw new BadRequestException('Debe enviar los sets o los puntajes del partido.');
    }

    // Avanzar de ronda al ganador o completar torneo
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
      if (tournament.type === 'elimination') {
        tournament.status = 'completed';
      } else if (tournament.type === 'round_robin' || tournament.type === 'americano') {
        const allPlayed = tournament.bracket.every(m => (m.sets && m.sets.length > 0) || (m.scoreA !== null && m.scoreB !== null));
        if (allPlayed) {
          tournament.status = 'completed';
        }
      } else if (tournament.type === 'groups_playoff') {
        if (match.stage === 'playoff' && match.matchId === 'F-1') {
          tournament.status = 'completed';
        }
      }
    }

    // Forzar actualización en Mongoose debido al nesting
    tournament.markModified('bracket');
    return tournament.save();
  }

  async advanceToPlayoffs(id: string): Promise<TournamentDocument> {
    const tournament = await this.findOne(id);

    if (tournament.status !== 'active') {
      throw new BadRequestException('El torneo debe estar activo para avanzar a eliminatorias.');
    }

    if (tournament.type !== 'groups_playoff') {
      throw new BadRequestException('Solo los torneos de fase de grupos pueden avanzar a eliminatorias.');
    }

    const groupMatches = tournament.bracket.filter(m => m.stage === 'groups');
    if (groupMatches.length === 0) {
      throw new BadRequestException('No se encontraron partidos de fase de grupos.');
    }

    const allGroupMatchesPlayed = groupMatches.every(m => (m.sets && m.sets.length > 0) || (m.scoreA !== null && m.scoreB !== null));
    if (!allGroupMatchesPlayed) {
      throw new BadRequestException('Todos los partidos de la fase de grupos deben jugarse antes de avanzar.');
    }

    const hasPlayoffMatches = tournament.bracket.some(m => m.stage === 'playoff');
    if (hasPlayoffMatches) {
      throw new BadRequestException('El torneo ya avanzó a la fase de eliminatorias.');
    }

    const groupNames = tournament.maxTeams === 8 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
    const qualifiedTeams: { [group: string]: TournamentTeam[] } = {};

    for (const groupName of groupNames) {
      const teamsInGroup = tournament.teams.filter(t => t.group === groupName);
      const matchesInGroup = groupMatches.filter(m => 
        m.teamA?.group === groupName && m.teamB?.group === groupName
      );

      const standings = this.calculateStandingsInternal(teamsInGroup, matchesInGroup);
      if (standings.length < 2) {
        throw new BadRequestException(`El grupo ${groupName} no tiene suficientes equipos.`);
      }
      qualifiedTeams[groupName] = [standings[0].team, standings[1].team];
    }

    const playoffMatches: TournamentMatch[] = [];

    if (tournament.maxTeams === 8) {
      const [a1, a2] = qualifiedTeams['A'];
      const [b1, b2] = qualifiedTeams['B'];

      playoffMatches.push({
        matchId: 'S-1',
        teamA: a1,
        teamB: b2,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'A',
        stage: 'playoff',
      });
      playoffMatches.push({
        matchId: 'S-2',
        teamA: b1,
        teamB: a2,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'B',
        stage: 'playoff',
      });
      playoffMatches.push({
        matchId: 'F-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: null, nextMatchSlot: null,
        stage: 'playoff',
      });
    } else {
      const [a1, a2] = qualifiedTeams['A'];
      const [b1, b2] = qualifiedTeams['B'];
      const [c1, c2] = qualifiedTeams['C'];
      const [d1, d2] = qualifiedTeams['D'];

      playoffMatches.push({
        matchId: 'Q-1',
        teamA: a1,
        teamB: b2,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-1', nextMatchSlot: 'A',
        stage: 'playoff',
      });
      playoffMatches.push({
        matchId: 'Q-2',
        teamA: c1,
        teamB: d2,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-1', nextMatchSlot: 'B',
        stage: 'playoff',
      });
      playoffMatches.push({
        matchId: 'Q-3',
        teamA: b1,
        teamB: a2,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-2', nextMatchSlot: 'A',
        stage: 'playoff',
      });
      playoffMatches.push({
        matchId: 'Q-4',
        teamA: d1,
        teamB: c2,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-2', nextMatchSlot: 'B',
        stage: 'playoff',
      });

      // Semifinales
      playoffMatches.push({
        matchId: 'S-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'A',
        stage: 'playoff',
      });
      playoffMatches.push({
        matchId: 'S-2',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'B',
        stage: 'playoff',
      });

      // Final
      playoffMatches.push({
        matchId: 'F-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: null, nextMatchSlot: null,
        stage: 'playoff',
      });
    }

    tournament.bracket.push(...playoffMatches);
    tournament.markModified('bracket');
    return tournament.save();
  }

  private calculateStandingsInternal(teams: TournamentTeam[], matches: TournamentMatch[]) {
    interface StandingEntry {
      teamId: string;
      team: TournamentTeam;
      matchesWon: number;
      setsDiff: number;
      gamesDiff: number;
    }

    const standingsMap = new Map<string, StandingEntry>();

    teams.forEach(team => {
      const idStr = team._id.toString();
      standingsMap.set(idStr, {
        teamId: idStr,
        team,
        matchesWon: 0,
        setsDiff: 0,
        gamesDiff: 0,
      });
    });

    matches.forEach(match => {
      if (match.scoreA === null || match.scoreB === null || !match.teamA || !match.teamB) {
        return;
      }

      const idA = match.teamA._id.toString();
      const idB = match.teamB._id.toString();
      const entryA = standingsMap.get(idA);
      const entryB = standingsMap.get(idB);

      if (entryA && entryB) {
        // Diferencia de sets ganados
        entryA.setsDiff += (match.scoreA - match.scoreB);
        entryB.setsDiff += (match.scoreB - match.scoreA);

        // Diferencia de games (sumando games de cada set)
        if (match.sets && match.sets.length > 0) {
          let gamesA = 0;
          let gamesB = 0;
          for (const set of match.sets) {
            gamesA += set.scoreA;
            gamesB += set.scoreB;
          }
          entryA.gamesDiff += (gamesA - gamesB);
          entryB.gamesDiff += (gamesB - gamesA);
        } else {
          // Fallback para partidos viejos sin sets
          entryA.gamesDiff += (match.scoreA - match.scoreB);
          entryB.gamesDiff += (match.scoreB - match.scoreA);
        }

        if (match.scoreA > match.scoreB) {
          entryA.matchesWon += 1;
        } else if (match.scoreB > match.scoreA) {
          entryB.matchesWon += 1;
        }
      }
    });

    const standings = Array.from(standingsMap.values());

    standings.sort((a, b) => {
      if (b.matchesWon !== a.matchesWon) {
        return b.matchesWon - a.matchesWon;
      }

      const h2hMatch = matches.find(m => 
        (m.teamA?._id?.toString() === a.teamId && m.teamB?._id?.toString() === b.teamId) ||
        (m.teamA?._id?.toString() === b.teamId && m.teamB?._id?.toString() === a.teamId)
      );
      if (h2hMatch && h2hMatch.winnerId) {
        if (h2hMatch.winnerId === a.teamId) return -1;
        if (h2hMatch.winnerId === b.teamId) return 1;
      }

      // Desempate por diferencia de games (clave para mejores terceros)
      if (b.gamesDiff !== a.gamesDiff) {
        return b.gamesDiff - a.gamesDiff;
      }

      return b.setsDiff - a.setsDiff;
    });

    return standings;
  }

  private generateRoundRobinMatches(teams: TournamentTeam[], stage: 'groups' | 'round_robin'): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    const n = teams.length;
    if (n < 2) return [];

    const rounds = n - 1;
    const matchesPerRound = n / 2;
    const list = [...teams];

    for (let r = 0; r < rounds; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const home = list[m];
        const away = list[n - 1 - m];

        const prefix = stage === 'round_robin' ? 'RR' : 'G';
        const groupSuffix = home.group ? `-${home.group}` : '';

        matches.push({
          matchId: `${prefix}${groupSuffix}-R${r + 1}-M${m + 1}`,
          teamA: home,
          teamB: away,
          scoreA: null,
          scoreB: null,
          winnerId: null,
          nextMatchId: null,
          nextMatchSlot: null,
          stage: stage,
        });
      }
      const last = list.pop()!;
      list.splice(1, 0, last);
    }
    return matches;
  }

  private generateInitialBracket(teams: TournamentTeam[], maxTeams: number): TournamentMatch[] {
    const bracket: TournamentMatch[] = [];

    if (maxTeams === 8) {
      bracket.push({
        matchId: 'Q-1',
        teamA: teams[0] || null,
        teamB: teams[1] || null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-1', nextMatchSlot: 'A',
        stage: 'playoff',
      });
      bracket.push({
        matchId: 'Q-2',
        teamA: teams[2] || null,
        teamB: teams[3] || null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-1', nextMatchSlot: 'B',
        stage: 'playoff',
      });
      bracket.push({
        matchId: 'Q-3',
        teamA: teams[4] || null,
        teamB: teams[5] || null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-2', nextMatchSlot: 'A',
        stage: 'playoff',
      });
      bracket.push({
        matchId: 'Q-4',
        teamA: teams[6] || null,
        teamB: teams[7] || null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'S-2', nextMatchSlot: 'B',
        stage: 'playoff',
      });

      bracket.push({
        matchId: 'S-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'A',
        stage: 'playoff',
      });
      bracket.push({
        matchId: 'S-2',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'B',
        stage: 'playoff',
      });

      bracket.push({
        matchId: 'F-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: null, nextMatchSlot: null,
        stage: 'playoff',
      });

    } else if (maxTeams === 16) {
      for (let i = 0; i < 8; i++) {
        const nextQ = `Q-${Math.floor(i / 2) + 1}`;
        const slot = i % 2 === 0 ? 'A' : 'B';
        bracket.push({
          matchId: `O-${i + 1}`,
          teamA: teams[i * 2] || null,
          teamB: teams[i * 2 + 1] || null,
          scoreA: null, scoreB: null, winnerId: null,
          nextMatchId: nextQ, nextMatchSlot: slot,
          stage: 'playoff',
        });
      }

      for (let i = 0; i < 4; i++) {
        const nextS = `S-${Math.floor(i / 2) + 1}`;
        const slot = i % 2 === 0 ? 'A' : 'B';
        bracket.push({
          matchId: `Q-${i + 1}`,
          teamA: null, teamB: null,
          scoreA: null, scoreB: null, winnerId: null,
          nextMatchId: nextS, nextMatchSlot: slot,
          stage: 'playoff',
        });
      }

      bracket.push({
        matchId: 'S-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'A',
        stage: 'playoff',
      });
      bracket.push({
        matchId: 'S-2',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: 'F-1', nextMatchSlot: 'B',
        stage: 'playoff',
      });

      bracket.push({
        matchId: 'F-1',
        teamA: null, teamB: null,
        scoreA: null, scoreB: null, winnerId: null,
        nextMatchId: null, nextMatchSlot: null,
        stage: 'playoff',
      });
    }

    return bracket;
  }

  async getStandings(id: string): Promise<any> {
    const tournament = await this.findOne(id);
    if (tournament.type === 'round_robin') {
      return this.calculateStandingsInternal(tournament.teams, tournament.bracket);
    } else if (tournament.type === 'groups_playoff') {
      const groupNames = tournament.maxTeams === 8 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
      const standings: { [group: string]: any[] } = {};
      const groupMatches = tournament.bracket.filter(m => m.stage === 'groups');
      for (const groupName of groupNames) {
        const teamsInGroup = tournament.teams.filter(t => t.group === groupName);
        const matchesInGroup = groupMatches.filter(m => 
          m.teamA?.group === groupName && m.teamB?.group === groupName
        );
        standings[groupName] = this.calculateStandingsInternal(teamsInGroup, matchesInGroup);
      }
      return standings;
    } else if (tournament.type === 'americano') {
      return this.calculateAmericanoStandings(tournament.teams, tournament.bracket);
    }
    return [];
  }

  private calculateAmericanoStandings(players: TournamentTeam[], matches: TournamentMatch[]) {
    interface IndividualStanding {
      playerId: string;
      name: string;
      phone: string;
      matchesPlayed: number;
      matchesWon: number;
      pointsWon: number;
      pointsLost: number;
      pointsDiff: number;
    }

    const standingsMap = new Map<string, IndividualStanding>();

    players.forEach(p => {
      const idStr = p._id.toString();
      standingsMap.set(idStr, {
        playerId: idStr,
        name: p.player1.name,
        phone: p.player1.phone || '',
        matchesPlayed: 0,
        matchesWon: 0,
        pointsWon: 0,
        pointsLost: 0,
        pointsDiff: 0,
      });
    });

    matches.forEach(match => {
      if (match.scoreA === null || match.scoreB === null || !match.teamA || !match.teamB) {
        return;
      }

      const findAndAddPoints = (player: TournamentPlayer, ptsWon: number, ptsLost: number, isWinner: boolean) => {
        const registered = players.find(p => p.player1.name === player.name && p.player1.phone === player.phone);
        if (registered) {
          const entry = standingsMap.get(registered._id.toString());
          if (entry) {
            entry.matchesPlayed += 1;
            if (isWinner) entry.matchesWon += 1;
            entry.pointsWon += ptsWon;
            entry.pointsLost += ptsLost;
            entry.pointsDiff += (ptsWon - ptsLost);
          }
        }
      };

      const scoreA = match.scoreA;
      const scoreB = match.scoreB;
      const aWon = scoreA > scoreB;
      const bWon = scoreB > scoreA;

      if (match.teamA.player1) findAndAddPoints(match.teamA.player1, scoreA, scoreB, aWon);
      if (match.teamA.player2) findAndAddPoints(match.teamA.player2, scoreA, scoreB, aWon);
      if (match.teamB.player1) findAndAddPoints(match.teamB.player1, scoreB, scoreA, bWon);
      if (match.teamB.player2) findAndAddPoints(match.teamB.player2, scoreB, scoreA, bWon);
    });

    const standings = Array.from(standingsMap.values());
    standings.sort((a, b) => {
      if (b.matchesWon !== a.matchesWon) {
        return b.matchesWon - a.matchesWon;
      }
      if (b.pointsDiff !== a.pointsDiff) {
        return b.pointsDiff - a.pointsDiff;
      }
      return b.pointsWon - a.pointsWon;
    });

    return standings;
  }

  private generateAmericanoMatches(players: TournamentTeam[]): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    const n = players.length;
    if (n < 4 || n % 4 !== 0) return [];

    const rounds = n - 1;
    const list = [...players];

    for (let r = 0; r < rounds; r++) {
      const partnerships: TournamentTeam[] = [];
      for (let m = 0; m < n / 2; m++) {
        const p1 = list[m];
        const p2 = list[n - 1 - m];
        
        const combinedTeam: TournamentTeam = {
          _id: new Types.ObjectId() as any,
          name: `${p1.player1.name} / ${p2.player1.name}`,
          player1: p1.player1,
          player2: p2.player1,
          registeredAt: new Date(),
          paymentStatus: 'pending',
        };
        partnerships.push(combinedTeam);
      }

      for (let i = 0; i < partnerships.length; i += 2) {
        matches.push({
          matchId: `AM-R${r + 1}-M${Math.floor(i / 2) + 1}`,
          teamA: partnerships[i],
          teamB: partnerships[i + 1],
          scoreA: null,
          scoreB: null,
          winnerId: null,
          nextMatchId: null,
          nextMatchSlot: null,
          stage: 'round_robin',
        });
      }

      const last = list.pop()!;
      list.splice(1, 0, last);
    }
    return matches;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    await this.findOne(id);
    await this.tournamentModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }

  async updateTeam(
    tournamentId: string,
    teamId: string,
    updateTeamDto: UpdateTeamDto,
  ): Promise<TournamentDocument> {
    const tournament = await this.findOne(tournamentId);

    // Solo restringir cambios de datos estructurales del equipo (nombre/jugadores) a la fase de registro
    const isEditingDetails =
      updateTeamDto.name !== undefined ||
      updateTeamDto.player1 !== undefined ||
      updateTeamDto.player2 !== undefined;

    if (isEditingDetails && tournament.status !== 'registration') {
      throw new BadRequestException(
        'Solo se pueden editar los datos del equipo cuando el torneo está en período de inscripciones.',
      );
    }

    const teamIndex = tournament.teams.findIndex(
      (t) => (t._id as any).toString() === teamId,
    );
    if (teamIndex === -1) {
      throw new NotFoundException('Equipo no encontrado en este torneo.');
    }

    const team = tournament.teams[teamIndex];
    if (updateTeamDto.name !== undefined) team.name = updateTeamDto.name;
    if (updateTeamDto.player1 !== undefined) team.player1 = updateTeamDto.player1;
    if (updateTeamDto.player2 !== undefined) team.player2 = updateTeamDto.player2;

    if (updateTeamDto.paymentStatus !== undefined) {
      team.paymentStatus = updateTeamDto.paymentStatus;
      if (updateTeamDto.paymentStatus === 'paid') {
        team.paymentDate = updateTeamDto.paymentDate
          ? new Date(updateTeamDto.paymentDate)
          : new Date();
      } else {
        team.paymentDate = undefined;
      }
    }

    tournament.markModified('teams');
    return tournament.save();
  }

  async removeTeam(
    tournamentId: string,
    teamId: string,
  ): Promise<TournamentDocument> {
    const tournament = await this.findOne(tournamentId);

    // Si el torneo ya estaba activo, reseteamos a registration y limpiamos bracket
    if (tournament.status === 'active') {
      tournament.status = 'registration';
      tournament.bracket = [];
      // Limpiar asignaciones de grupo
      tournament.teams.forEach((t) => {
        t.group = undefined;
      });
    } else if (tournament.status === 'completed') {
      throw new BadRequestException(
        'No se puede eliminar equipos de un torneo completado.',
      );
    }

    const teamIndex = tournament.teams.findIndex(
      (t) => (t._id as any).toString() === teamId,
    );
    if (teamIndex === -1) {
      throw new NotFoundException('Equipo no encontrado en este torneo.');
    }

    tournament.teams.splice(teamIndex, 1);
    tournament.markModified('teams');
    tournament.markModified('bracket');
    return tournament.save();
  }

  async shuffleGroupMatches(tournamentId: string): Promise<TournamentDocument> {
    const tournament = await this.findOne(tournamentId);

    if (tournament.status !== 'active') {
      throw new BadRequestException('El torneo debe estar activo para mezclar enfrentamientos.');
    }

    if (tournament.type !== 'groups_playoff') {
      throw new BadRequestException('Solo los torneos con fase de grupos permiten mezclar enfrentamientos.');
    }

    const groupMatches = tournament.bracket.filter((m) => m.stage === 'groups');
    const hasPlayoffMatches = tournament.bracket.some((m) => m.stage === 'playoff');

    if (hasPlayoffMatches) {
      throw new BadRequestException('No se pueden mezclar enfrentamientos si ya se avanzó a eliminatorias.');
    }

    const hasResults = groupMatches.some((m) => (m.sets && m.sets.length > 0) || m.scoreA !== null || m.scoreB !== null);
    if (hasResults) {
      throw new BadRequestException(
        'No se pueden mezclar enfrentamientos si ya se cargaron resultados. Reiniciá los resultados primero.',
      );
    }

    // Regenerar partidos de grupo con nuevo orden
    const groupNames = tournament.maxTeams === 8 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
    const allGroupMatches: TournamentMatch[] = [];

    for (const groupName of groupNames) {
      const teamsInGroup = tournament.teams.filter((t) => t.group === groupName);
      // Fisher-Yates shuffle de los equipos para cambiar el orden de enfrentamientos
      const shuffled = [...teamsInGroup];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const groupMatchesNew = this.generateRoundRobinMatches(shuffled, 'groups');
      allGroupMatches.push(...groupMatchesNew);
    }

    tournament.bracket = allGroupMatches;
    tournament.markModified('bracket');
    return tournament.save();
  }
}
