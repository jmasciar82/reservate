import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type TeacherDocument = Teacher & Document;

@Schema({ _id: false })
export class AvailabilitySlot {
  @Prop({ required: true })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Prop({ required: true })
  startTime: string; // "HH:MM", e.g. "08:00"

  @Prop({ required: true })
  endTime: string; // "HH:MM", e.g. "13:00"
}

export const AvailabilitySlotSchema = SchemaFactory.createForClass(AvailabilitySlot);

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

  @Prop({ type: [AvailabilitySlotSchema], default: [] })
  availability: AvailabilitySlot[];
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);

