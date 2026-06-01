import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ required: false, default: '📦' })
  icon?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true })
  clubId: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
