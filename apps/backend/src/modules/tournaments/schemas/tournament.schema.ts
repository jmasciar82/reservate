import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class TournamentPlayer {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  phone?: string;

  @Prop()
  email?: string;
}

@Schema()
export class TournamentTeam {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: TournamentPlayer, required: true })
  player1: TournamentPlayer;

  @Prop({ type: TournamentPlayer, required: false })
  player2?: TournamentPlayer;

  @Prop({ required: false })
  group?: string;

  @Prop({ default: Date.now })
  registeredAt: Date;

  @Prop({ required: true, enum: ['pending', 'paid'], default: 'pending' })
  paymentStatus: 'pending' | 'paid';

  @Prop({ required: false })
  paymentDate?: Date;
}

export const TournamentTeamSchema = SchemaFactory.createForClass(TournamentTeam);

@Schema({ _id: false })
export class SetScore {
  @Prop({ type: Number, required: true })
  scoreA: number;

  @Prop({ type: Number, required: true })
  scoreB: number;
}

const SetScoreSchema = SchemaFactory.createForClass(SetScore);

@Schema({ _id: false })
export class TournamentMatch {
  @Prop({ required: true })
  matchId: string; // Ej: "Q-1" (Quarter 1), "S-2" (Semi 2), "F-1" (Final), o "G-A-1", "RR-1"

  @Prop({ type: TournamentTeamSchema, default: null })
  teamA: TournamentTeam | null;

  @Prop({ type: TournamentTeamSchema, default: null })
  teamB: TournamentTeam | null;

  @Prop({ type: Number, default: null })
  scoreA: number | null; // Sets ganados por A (o puntos en americano)

  @Prop({ type: Number, default: null })
  scoreB: number | null; // Sets ganados por B (o puntos en americano)

  @Prop({ type: [SetScoreSchema], default: [] })
  sets?: SetScore[]; // Detalle de cada set: [{scoreA: 6, scoreB: 4}, ...]

  @Prop({ type: String, default: null })
  winnerId: string | null; // ID del equipo ganador (como string)

  @Prop({ type: String, default: null })
  nextMatchId: string | null; // Id del partido a donde avanza el ganador (ej: "S-1")

  @Prop({ type: String, enum: ['A', 'B'], default: null })
  nextMatchSlot: 'A' | 'B' | null; // Si avanza como equipo A o B en el siguiente partido

  @Prop({ type: String, enum: ['groups', 'playoff', 'round_robin'], default: 'playoff' })
  stage: 'groups' | 'playoff' | 'round_robin';
}

const TournamentMatchSchema = SchemaFactory.createForClass(TournamentMatch);

export type TournamentDocument = Tournament & Document;

@Schema({ timestamps: true })
export class Tournament {
  @Prop({ required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Club', required: true })
  clubId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: 'padel' })
  sport: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, default: 0 })
  registrationFee: number;

  @Prop({ required: true, default: 8 })
  maxTeams: number; // Ej: 8 o 16

  @Prop({ required: true, enum: ['elimination', 'round_robin', 'groups_playoff', 'americano'], default: 'elimination' })
  type: 'elimination' | 'round_robin' | 'groups_playoff' | 'americano';

  @Prop({ required: true, enum: ['draft', 'registration', 'active', 'completed'], default: 'registration' })
  status: 'draft' | 'registration' | 'active' | 'completed';

  @Prop({ type: [TournamentTeamSchema], default: [] })
  teams: TournamentTeam[];

  @Prop({ type: [TournamentMatchSchema], default: [] })
  bracket: TournamentMatch[];
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);
