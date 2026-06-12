import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type TeacherDocument = Teacher & Document;

@Schema({ timestamps: true })
export class Teacher {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: true, default: 0 })
  pricePerHour: number;

  @Prop({ required: true, enum: ['padel', 'football'], default: 'padel' })
  sport: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true })
  clubId: Types.ObjectId;
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);
