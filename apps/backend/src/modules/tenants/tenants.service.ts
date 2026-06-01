import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async create(name: string): Promise<Tenant> {
    const createdTenant = new this.tenantModel({ name });
    return createdTenant.save();
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantModel.find().exec();
  }

  async findOne(id: string): Promise<Tenant | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.tenantModel.findById(id).exec();
  }

  async update(id: string, name?: string, isActive?: boolean): Promise<Tenant | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await this.tenantModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Inquilino no encontrado.');
    }
    return updated;
  }

  async remove(id: string): Promise<Tenant | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.tenantModel.findByIdAndDelete(id).exec();
  }
}
