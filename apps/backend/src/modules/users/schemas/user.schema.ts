import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'player', enum: ['player', 'admin', 'club_owner'] })
  role: string;

  @Prop({ default: 1 })
  skillLevel: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
