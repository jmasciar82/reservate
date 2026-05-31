import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: false })
  userId?: string;

  @Prop({ required: true, default: 'sistema' })
  userName: string;

  @Prop({ required: false })
  userEmail?: string;

  @Prop({ required: true })
  action: string; // 'create_reservation', 'update_reservation', 'reschedule_reservation', 'cancel_reservation', 'delete_reservation'

  @Prop({ required: true })
  targetType: string; // 'reservation'

  @Prop({ required: true })
  targetId: string; // ID de la reserva

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: false })
  clubId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false })
  tenantId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  details?: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
