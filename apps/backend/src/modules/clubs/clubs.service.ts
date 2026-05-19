import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';
import { CreateClubDto } from './dto/create-club.dto';

@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
  ) {}

  async create(createClubDto: CreateClubDto): Promise<Club> {
    const created = new this.clubModel(createClubDto);
    return created.save();
  }

  async findAll(): Promise<Club[]> {
    return this.clubModel.find().exec();
  }
}
