import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'player', enum: ['player', 'admin', 'club_owner', 'staff'] })
  role: string;

  @Prop({ default: 1 })
  skillLevel: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: false })
  clubId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false })
  tenantId?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
