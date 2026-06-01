import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = new this.productModel({
      ...createProductDto,
      clubId: new Types.ObjectId(createProductDto.clubId),
    });
    return createdProduct.save();
  }

  async findAll(clubId?: string | string[]): Promise<Product[]> {
    let filter = {};
    if (clubId) {
      if (Array.isArray(clubId)) {
        filter = { clubId: { $in: clubId.map((id) => new Types.ObjectId(id)) } };
      } else {
        filter = { clubId: new Types.ObjectId(clubId) };
      }
    }
    return this.productModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Product | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.productModel.findById(id).exec();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null> {
    const updateData: any = { ...updateProductDto };
    if (updateProductDto.clubId) {
      updateData.clubId = new Types.ObjectId(updateProductDto.clubId);
    }
    return this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Product | null> {
    return this.productModel.findByIdAndDelete(id).exec();
  }
}
