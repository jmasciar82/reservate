import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type CourtDocument = Court & Document;

@Schema({ timestamps: true })
export class Court {
  @Prop({ required: true })
  name: string; // e.g., 'Cancha 1'

  @Prop({ required: true })
  sport: string; // e.g., 'padel'

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true })
  clubId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isCovered: boolean;

  @Prop({ required: true, default: 0 })
  pricePerHour: number;
}

export const CourtSchema = SchemaFactory.createForClass(Court);
