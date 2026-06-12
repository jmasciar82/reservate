import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type ReservationDocument = Reservation & Document;

@Schema({ _id: false })
export class ReservationProduct {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ required: true, default: 0 })
  total: number;
}

const ReservationProductSchema = SchemaFactory.createForClass(ReservationProduct);

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
  paymentDate?: Date;

  @Prop({ required: false })
  preferenceId?: string;

  @Prop({ required: false })
  paymentId?: string;

  @Prop({ required: false })
  recurrenceGroupId?: string;

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop({ default: 'standard', enum: ['standard', 'escuelita_padel', 'escuelita_futbol', 'clase_particular_padel', 'clase_particular_futbol'] })
  reservationType: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: false })
  teacherId?: Types.ObjectId;

  @Prop({ default: 0 })
  teacherPrice?: number;

  @Prop({ type: [ReservationProductSchema], default: [] })
  products: ReservationProduct[];

  @Prop({ default: 0 })
  productsPrice: number;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

