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
    const created = new this.clubModel(createClubDto);
    return created.save();
  }

  async findAll(): Promise<Club[]> {
    return this.clubModel.find().sort({ name: 1 }).exec();
  }

  async update(id: string, updateClubDto: UpdateClubDto): Promise<Club | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El club indicado no es válido.');
    }

    return this.clubModel
      .findByIdAndUpdate(id, updateClubDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Club | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El club indicado no es válido.');
    }

    return this.clubModel.findByIdAndDelete(id).exec();
  }
}
