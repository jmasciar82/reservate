import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type ClubDocument = Club & Document;

@Schema({ timestamps: true })
export class Club {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false })
  tenantId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ type: [String], default: [] })
  sports: string[]; // e.g., ['padel', 'tennis']

  @Prop()
  description: string;

  @Prop({ default: true })
  bookingEnabled: boolean;

  @Prop({ default: 'percentage', enum: ['percentage', 'fixed', 'none'] })
  depositType: string;

  @Prop({ default: 30 })
  depositValue: number;

  @Prop({ required: false })
  mpAccessToken?: string;

  @Prop({ required: false })
  mpPublicKey?: string;

  @Prop({ unique: true, sparse: true, index: true, required: false })
  subdomain?: string;

  @Prop({ unique: true, sparse: true, index: true, required: false })
  customDomain?: string;
}

export const ClubSchema = SchemaFactory.createForClass(Club);
