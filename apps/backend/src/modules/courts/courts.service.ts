import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Court, CourtDocument } from './schemas/court.schema';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import {
  Reservation,
  ReservationDocument,
} from '../reservations/schemas/reservation.schema';

@Injectable()
export class CourtsService {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
  ) {}

  async create(createCourtDto: CreateCourtDto): Promise<Court> {
    const createdCourt = new this.courtModel(createCourtDto);
    return createdCourt.save();
  }

  async findAll(clubId?: string | string[]): Promise<Court[]> {
    let filter = {};
    if (clubId) {
      if (Array.isArray(clubId)) {
        filter = { clubId: { $in: clubId.map((id) => new Types.ObjectId(id)) } };
      } else {
        filter = { clubId: new Types.ObjectId(clubId) };
      }
    }
    return this.courtModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Court | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.courtModel.findById(id).exec();
  }

  async update(
    id: string,
    updateCourtDto: UpdateCourtDto,
  ): Promise<Court | null> {
    return this.courtModel
      .findByIdAndUpdate(id, updateCourtDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Court | null> {
    return this.courtModel.findByIdAndDelete(id).exec();
  }

  async findAvailable(
    startTime: Date,
    endTime: Date,
    clubId?: string,
  ): Promise<Court[]> {
    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      endTime <= startTime
    ) {
      throw new BadRequestException('El rango horario no es válido.');
    }

    if (clubId && !Types.ObjectId.isValid(clubId)) {
      throw new BadRequestException('El club indicado no es válido.');
    }

    const activeReservations = await this.reservationModel
      .find({
        status: { $ne: 'cancelled' },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      })
      .exec();

    const occupiedCourtIds = activeReservations.map((res) => res.courtId);

    const baseQuery = {
      isActive: true,
      _id: { $nin: occupiedCourtIds },
    };

    const query = clubId
      ? { ...baseQuery, clubId: new Types.ObjectId(clubId) }
      : baseQuery;

    console.log("findAvailable params:", { startTime, endTime, clubId });
    console.log("findAvailable query:", query);
    
    const courts = await this.courtModel.find(query).exec();
    console.log("findAvailable courts found:", courts.length);
    
    return courts;
  }
}
