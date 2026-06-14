import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type SocioDocument = Socio & Document;

@Schema({ _id: true, timestamps: true })
export class AbonoPayment {
  @Prop({ required: true })
  month: string; // Formato: "YYYY-MM", ej: "2026-06"

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['paid', 'pending'], default: 'paid' })
  status: string;

  @Prop({ required: true, default: Date.now })
  paymentDate: Date;

  @Prop({ required: false })
  paymentMethod?: string; // Ej: "Efectivo", "Transferencia", "Tarjeta"

  @Prop({ required: false })
  notes?: string;
}

export const AbonoPaymentSchema = SchemaFactory.createForClass(AbonoPayment);

@Schema({ timestamps: true })
export class Socio {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: false })
  dni?: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true })
  clubId: Types.ObjectId;

  @Prop({ type: [AbonoPaymentSchema], default: [] })
  payments: AbonoPayment[];
}

export const SocioSchema = SchemaFactory.createForClass(Socio);
