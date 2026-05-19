import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClubDocument = Club & Document;

@Schema({ timestamps: true })
export class Club {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ type: [String], default: [] })
  sports: string[]; // e.g., ['padel', 'tennis']

  @Prop()
  description: string;
}

export const ClubSchema = SchemaFactory.createForClass(Club);
