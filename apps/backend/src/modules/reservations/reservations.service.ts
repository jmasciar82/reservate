import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { UpdateReservationDto } from './dto/update-reservation.dto';

const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
const PAYMENT_STATUSES = ['pending', 'paid'];

interface ReservationQuery {
  date?: string;
  clubId?: string;
}

function getArgentinaDayRange(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD.');
  }

  const start = new Date(`${date}T00:00:00.000-03:00`);

  if (Number.isNaN(start.getTime())) {
    throw new BadRequestException('La fecha indicada no es válida.');
  }

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const { courtId, startTime, endTime, isRecurring, recurrenceWeeks } = createReservationDto;

    if (!Types.ObjectId.isValid(courtId)) {
      throw new BadRequestException('La cancha indicada no es válida.');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw new BadRequestException('El horario de la reserva no es válido.');
    }

    const court = await this.courtModel.findById(courtId).exec();
    if (!court) {
      throw new NotFoundException('La cancha especificada no existe.');
    }

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalPrice = Math.round(durationHours * court.pricePerHour);

    if (isRecurring) {
      const recurrenceWeeksCount = recurrenceWeeks || 4;
      const conflicts: string[] = [];
      const weeksToCreate: { start: Date; end: Date }[] = [];

      for (let i = 0; i < recurrenceWeeksCount; i++) {
        const weekStart = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(end.getTime() + i * 7 * 24 * 60 * 60 * 1000);

        const overlapping = await this.reservationModel
          .findOne({
            courtId,
            status: { $ne: 'cancelled' },
            startTime: { $lt: weekEnd },
            endTime: { $gt: weekStart },
          })
          .exec();

        if (overlapping) {
          const dateStr = weekStart.toLocaleDateString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
          });
          conflicts.push(`Semana ${i + 1} (${dateStr})`);
        } else {
          weeksToCreate.push({ start: weekStart, end: weekEnd });
        }
      }

      if (conflicts.length > 0) {
        throw new ConflictException(
          `Solapamientos detectados en: ${conflicts.join(', ')}. No se pudo crear el turno fijo.`,
        );
      }

      const recurrenceGroupId = new Types.ObjectId().toString();
      const reservationsToSave = weeksToCreate.map((week) => {
        return new this.reservationModel({
          ...createReservationDto,
          courtId: new Types.ObjectId(courtId),
          startTime: week.start,
          endTime: week.end,
          totalPrice,
          paymentStatus: 'pending',
          isRecurring: true,
          recurrenceGroupId,
        });
      });

      const savedReservations = await this.reservationModel.insertMany(reservationsToSave);
      return savedReservations[0];
    } else {
      const overlapping = await this.reservationModel
        .findOne({
          courtId,
          status: { $ne: 'cancelled' },
          startTime: { $lt: end },
          endTime: { $gt: start },
        })
        .exec();

      if (overlapping) {
        throw new ConflictException(
          'La cancha ya está reservada en este horario.',
        );
      }

      const createdReservation = new this.reservationModel({
        ...createReservationDto,
        courtId: new Types.ObjectId(courtId),
        startTime: start,
        endTime: end,
        totalPrice,
        paymentStatus: 'pending',
      });

      return createdReservation.save();
    }
  }

  async findAll(query?: ReservationQuery): Promise<Reservation[]> {
    let dateFilter = {};

    if (query?.date) {
      const { start, end } = getArgentinaDayRange(query.date);
      dateFilter = {
        startTime: {
          $gte: start,
          $lt: end,
        },
      };
    }

    let clubFilter = {};

    if (query?.clubId) {
      if (!Types.ObjectId.isValid(query.clubId)) {
        throw new BadRequestException('El club indicado no es válido.');
      }

      const courtIds = await this.courtModel
        .find({ clubId: new Types.ObjectId(query.clubId) })
        .distinct('_id')
        .exec();

      clubFilter = {
        courtId: { $in: courtIds },
      };
    }

    return this.reservationModel
      .find({ ...dateFilter, ...clubFilter })
      .populate('courtId')
      .sort({ startTime: 1 })
      .exec();
  }

  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
  ): Promise<Reservation | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('La reserva indicada no es válida.');
    }

    if (
      updateReservationDto.status &&
      !RESERVATION_STATUSES.includes(updateReservationDto.status)
    ) {
      throw new BadRequestException('El estado de la reserva no es válido.');
    }

    if (
      updateReservationDto.paymentStatus &&
      !PAYMENT_STATUSES.includes(updateReservationDto.paymentStatus)
    ) {
      throw new BadRequestException('El estado de pago no es válido.');
    }

    const existingReservation = await this.reservationModel.findById(id).exec();
    if (!existingReservation) {
      throw new BadRequestException('Reserva no encontrada.');
    }

    // Confirmación automática: si se registra el pago, se confirma la reserva
    if (
      updateReservationDto.paymentStatus === 'paid' &&
      existingReservation.status !== 'cancelled' &&
      (!updateReservationDto.status || updateReservationDto.status === 'pending')
    ) {
      updateReservationDto.status = 'confirmed';
    }

    // Cancelación en cascada para series recurrentes
    if (
      updateReservationDto.status === 'cancelled' &&
      updateReservationDto.cancelSeries &&
      existingReservation.isRecurring &&
      existingReservation.recurrenceGroupId
    ) {
      await this.reservationModel
        .updateMany(
          {
            recurrenceGroupId: existingReservation.recurrenceGroupId,
            startTime: { $gte: existingReservation.startTime },
            status: { $ne: 'cancelled' },
          },
          {
            $set: { status: 'cancelled' },
          },
        )
        .exec();

      return this.reservationModel.findById(id).populate('courtId').exec();
    }

    return this.reservationModel
      .findByIdAndUpdate(id, updateReservationDto, { new: true })
      .populate('courtId')
      .exec();
  }
}
