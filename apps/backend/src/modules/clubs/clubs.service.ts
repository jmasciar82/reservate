import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  constructor(@InjectModel(Club.name) private clubModel: Model<ClubDocument>) {}

  async create(createClubDto: CreateClubDto): Promise<Club> {
    const { tenantId, subdomain, customDomain, ...rest } = createClubDto;
    const created = new this.clubModel({
      ...rest,
      subdomain: subdomain?.trim() || undefined,
      customDomain: customDomain?.trim() || undefined,
      tenantId: tenantId ? new Types.ObjectId(tenantId) : undefined,
    });
    return created.save();
  }

  async findAll(): Promise<Club[]> {
    return this.clubModel.find().sort({ name: 1 }).exec();
  }

  async findByTenant(tenantId: string): Promise<Club[]> {
    if (!Types.ObjectId.isValid(tenantId)) {
      return [];
    }
    return this.clubModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Club | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.clubModel.findById(id).exec();
  }

  async update(id: string, updateClubDto: UpdateClubDto): Promise<Club | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El club indicado no es válido.');
    }

    const { tenantId, subdomain, customDomain, ...rest } = updateClubDto;
    const updatePayload: any = {
      ...rest,
    };
    if (tenantId) {
      updatePayload.tenantId = new Types.ObjectId(tenantId);
    }
    
    const unsetPayload: any = {};

    if (subdomain?.trim()) {
      updatePayload.subdomain = subdomain.trim();
    } else {
      unsetPayload.subdomain = 1;
    }

    if (customDomain?.trim()) {
      updatePayload.customDomain = customDomain.trim();
    } else {
      unsetPayload.customDomain = 1;
    }

    const updateQuery: any = { $set: updatePayload };
    if (Object.keys(unsetPayload).length > 0) {
      updateQuery.$unset = unsetPayload;
    }

    return this.clubModel
      .findByIdAndUpdate(id, updateQuery, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Club | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El club indicado no es válido.');
    }

    return this.clubModel.findByIdAndDelete(id).exec();
  }
}
