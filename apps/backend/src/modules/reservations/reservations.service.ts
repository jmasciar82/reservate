import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const { courtId, startTime, endTime } = createReservationDto;

    // Find the court to get its pricePerHour
    const court = await this.courtModel.findById(courtId).exec();
    if (!court) {
      throw new NotFoundException('La cancha especificada no existe.');
    }

    // Check for overlapping reservations on the same court (that are not cancelled)
    const overlapping = await this.reservationModel.findOne({
      courtId,
      status: { $ne: 'cancelled' },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) },
    }).exec();

    if (overlapping) {
      throw new ConflictException('La cancha ya está reservada en este horario.');
    }

    // Calculate duration in hours
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalPrice = Math.round(durationHours * court.pricePerHour);

    const createdReservation = new this.reservationModel({
      ...createReservationDto,
      totalPrice,
      paymentStatus: 'pending',
    });
    return createdReservation.save();
  }

  async findAll(): Promise<Reservation[]> {
    return this.reservationModel.find().populate('courtId').exec();
  }

  async update(id: string, updateReservationDto: UpdateReservationDto): Promise<Reservation | null> {
    return this.reservationModel
      .findByIdAndUpdate(id, updateReservationDto, { new: true })
      .populate('courtId')
      .exec();
  }
}
