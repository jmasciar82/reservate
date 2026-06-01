import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { ClubsModule } from '../clubs/clubs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
    ClubsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [MongooseModule, ProductsService],
})
export class ProductsModule {}
