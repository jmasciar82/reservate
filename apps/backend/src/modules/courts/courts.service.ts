import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Court, CourtDocument } from './schemas/court.schema';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';

@Injectable()
export class CourtsService {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
  ) {}

  async create(createCourtDto: CreateCourtDto): Promise<Court> {
    const createdCourt = new this.courtModel(createCourtDto);
    return createdCourt.save();
  }

  async findAll(): Promise<Court[]> {
    return this.courtModel.find().exec();
  }

  async update(id: string, updateCourtDto: UpdateCourtDto): Promise<Court | null> {
    return this.courtModel
      .findByIdAndUpdate(id, updateCourtDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Court | null> {
    return this.courtModel.findByIdAndDelete(id).exec();
  }

  async findAvailable(startTime: Date, endTime: Date): Promise<Court[]> {
    const activeReservations = await this.reservationModel.find({
      status: { $ne: 'cancelled' },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    }).exec();

    const occupiedCourtIds = activeReservations.map(res => res.courtId);

    return this.courtModel.find({
      isActive: true,
      _id: { $nin: occupiedCourtIds }
    }).exec();
  }
}
