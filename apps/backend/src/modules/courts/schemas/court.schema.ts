import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourtDocument = Court & Document;

@Schema({ timestamps: true })
export class Court {
  @Prop({ required: true })
  name: string; // e.g., 'Cancha 1'

  @Prop({ required: true })
  sport: string; // e.g., 'padel'

  @Prop({ type: Types.ObjectId, ref: 'Club', required: true })
  clubId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const CourtSchema = SchemaFactory.createForClass(Court);
