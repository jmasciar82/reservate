import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true })
  courtId: Types.ObjectId;

  @Prop({ required: false })
  userId?: string;

  @Prop({ required: false })
  firstName?: string;

  @Prop({ required: false })
  lastName?: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({
    default: 'pending',
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
  })
  status: string;

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: 0 })
  depositAmount: number;

  @Prop({ default: 'pending', enum: ['pending', 'paid'] })
  paymentStatus: string;

  @Prop({ required: false })
  preferenceId?: string;

  @Prop({ required: false })
  paymentId?: string;

  @Prop({ required: false })
  recurrenceGroupId?: string;

  @Prop({ default: false })
  isRecurring: boolean;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
