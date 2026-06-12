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
import { NotificationsService } from '../notifications/notifications.service';
import { Teacher, TeacherDocument } from '../teachers/schemas/teacher.schema';

const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
const PAYMENT_STATUSES = ['pending', 'paid'];

interface ReservationQuery {
  date?: string;
  clubId?: string | string[];
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
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getArgentinaTimeDetails(date: Date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).formatToParts(date);

    const map = new Map(parts.map(p => [p.type, p.value]));
    const year = parseInt(map.get('year')!, 10);
    const month = parseInt(map.get('month')!, 10) - 1;
    const day = parseInt(map.get('day')!, 10);
    const hour = parseInt(map.get('hour')!, 10);
    const minute = parseInt(map.get('minute')!, 10);

    const localDate = new Date(year, month, day, hour, minute);
    const dayOfWeek = localDate.getDay();
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    return {
      dayOfWeek,
      hour,
      minute,
      timeStr
    };
  }

  private validateTeacherAvailability(teacher: any, start: Date, end: Date) {
    if (!teacher.availability || teacher.availability.length === 0) {
      return;
    }

    const startLocal = this.getArgentinaTimeDetails(start);
    const endLocal = this.getArgentinaTimeDetails(end);

    const reqStartMin = startLocal.hour * 60 + startLocal.minute;
    const reqEndMin = endLocal.hour * 60 + endLocal.minute;
    const dayOfWeek = startLocal.dayOfWeek;

    const isCovered = teacher.availability.some((slot: any) => {
      if (slot.dayOfWeek !== dayOfWeek) return false;

      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const slotStartMin = sh * 60 + sm;
      const slotEndMin = eh * 60 + em;

      return reqStartMin >= slotStartMin && reqEndMin <= slotEndMin;
    });

    if (!isCovered) {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      throw new BadRequestException(
        `El profesor ${teacher.name} no tiene disponibilidad horaria configurada para el día ${days[dayOfWeek]} en el rango de ${startLocal.timeStr} a ${endLocal.timeStr}.`
      );
    }
  }


  async create(
    createReservationDto: CreateReservationDto,
    callerClubId?: string,
  ): Promise<Reservation> {
    const start = new Date(createReservationDto.startTime);
    const end = new Date(createReservationDto.endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw new BadRequestException('El horario de la reserva no es válido.');
    }

    const isEscuelita = createReservationDto.reservationType === 'escuelita_padel' || createReservationDto.reservationType === 'escuelita_futbol';
    if (isEscuelita) {
      const durationMin = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      if (durationMin !== 60) {
        throw new BadRequestException('Las reservas de escuelita deben ser de exactamente 1 hora.');
      }
      createReservationDto.isRecurring = true;
      if (!createReservationDto.recurrenceWeeks) {
        createReservationDto.recurrenceWeeks = 12;
      }
    }

    const { courtId, startTime, endTime, isRecurring, recurrenceWeeks } = createReservationDto;

    if (!Types.ObjectId.isValid(courtId)) {
      throw new BadRequestException('La cancha indicada no es válida.');
    }

    const court = await this.courtModel.findById(courtId).populate('clubId').exec();
    if (!court) {
      throw new NotFoundException('La cancha especificada no existe.');
    }

    if (callerClubId && court.clubId.toString() !== callerClubId) {
      throw new BadRequestException('No tienes permiso para reservar en esta cancha.');
    }

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const courtPrice = Math.round(durationHours * court.pricePerHour);

    let teacherPrice = 0;
    if (createReservationDto.teacherId) {
      const teacher = await this.teacherModel.findById(createReservationDto.teacherId).exec();
      if (!teacher) {
        throw new NotFoundException('El profesor especificado no existe.');
      }
      this.validateTeacherAvailability(teacher, start, end);
      teacherPrice = Math.round(durationHours * teacher.pricePerHour);
    }


    let productsPrice = 0;
    let productsList: any[] = [];
    if (createReservationDto.products && createReservationDto.products.length > 0) {
      productsList = createReservationDto.products.map(p => {
        const qty = Number(p.quantity) || 1;
        const prc = Number(p.price) || 0;
        return {
          name: p.name,
          quantity: qty,
          price: prc,
          total: qty * prc
        };
      });
      productsPrice = productsList.reduce((sum, item) => sum + item.total, 0);
    }

    const totalPrice = createReservationDto.teacherId
      ? (teacherPrice + productsPrice)
      : (courtPrice + productsPrice);


    if (isRecurring) {
      const recurrenceWeeksCount = recurrenceWeeks || 4;
      const conflicts: string[] = [];
      const weeksToCreate: { start: Date; end: Date }[] = [];

      for (let i = 0; i < recurrenceWeeksCount; i++) {
        const weekStart = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(end.getTime() + i * 7 * 24 * 60 * 60 * 1000);

        const courtOverlapping = await this.reservationModel
          .findOne({
            courtId,
            status: { $ne: 'cancelled' },
            startTime: { $lt: weekEnd },
            endTime: { $gt: weekStart },
          })
          .exec();

        let teacherOverlapping = null;
        if (createReservationDto.teacherId) {
          teacherOverlapping = await this.reservationModel
            .findOne({
              teacherId: new Types.ObjectId(createReservationDto.teacherId),
              status: { $ne: 'cancelled' },
              startTime: { $lt: weekEnd },
              endTime: { $gt: weekStart },
            })
            .exec();
        }

        if (courtOverlapping || teacherOverlapping) {
          const dateStr = weekStart.toLocaleDateString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
          });
          const reason = courtOverlapping ? 'cancha ocupada' : 'profesor ocupado';
          conflicts.push(`Semana ${i + 1} (${dateStr} - ${reason})`);
        } else {
          weeksToCreate.push({ start: weekStart, end: weekEnd });
        }
      }

      if (conflicts.length > 0) {
        throw new ConflictException(
          `Solapamientos detectados en: ${conflicts.join(', ')}. No se pudo crear el turno fijo.`,
        );
      }

      const isPaid = createReservationDto.paymentStatus === 'paid';
      const recurrenceGroupId = new Types.ObjectId().toString();
      
      const basePricePerWeek = createReservationDto.teacherId ? teacherPrice : courtPrice;

      // Detect if it is a block payment (Full Payment for all weeks) at creation
      const isBlockPayment = isPaid && (
        createReservationDto.payBlock === true || (
          createReservationDto.depositAmount !== undefined && 
          Number(createReservationDto.depositAmount) >= Math.round(basePricePerWeek * recurrenceWeeksCount * 0.85)
        )
      );

      const reservationsToSave = weeksToCreate.map((week, idx) => {
        const isFirst = idx === 0;

        if (isBlockPayment) {
          const discountedPrice = Math.round(basePricePerWeek * 0.90) + (isFirst ? productsPrice : 0);
          return new this.reservationModel({
            ...createReservationDto,
            courtId: new Types.ObjectId(courtId),
            teacherId: createReservationDto.teacherId ? new Types.ObjectId(createReservationDto.teacherId) : undefined,
            teacherPrice,
            startTime: week.start,
            endTime: week.end,
            totalPrice: discountedPrice,
            paymentStatus: 'paid',
            paymentDate: new Date(),
            depositAmount: discountedPrice,
            status: 'confirmed',
            isRecurring: true,
            recurrenceGroupId,
            products: isFirst ? productsList : [],
            productsPrice: isFirst ? productsPrice : 0,
          });
        } else {
          const weekBasePrice = basePricePerWeek;
          const weekProductsPrice = isFirst ? productsPrice : 0;
          const weekTotalPrice = weekBasePrice + weekProductsPrice;
          const weekDeposit = (isPaid && isFirst) ? (createReservationDto.depositAmount || weekTotalPrice) : 0;
          return new this.reservationModel({
            ...createReservationDto,
            courtId: new Types.ObjectId(courtId),
            teacherId: createReservationDto.teacherId ? new Types.ObjectId(createReservationDto.teacherId) : undefined,
            teacherPrice,
            startTime: week.start,
            endTime: week.end,
            totalPrice: weekTotalPrice,
            paymentStatus: (weekDeposit >= weekTotalPrice) ? 'paid' : 'pending',
            paymentDate: ((isPaid || weekDeposit > 0) && isFirst) ? new Date() : undefined,
            depositAmount: weekDeposit,
            status: ((isPaid || weekDeposit > 0) && isFirst) ? 'confirmed' : (createReservationDto.status || 'pending'),
            isRecurring: true,
            recurrenceGroupId,
            products: isFirst ? productsList : [],
            productsPrice: isFirst ? productsPrice : 0,
          });
        }
      });

      const savedReservations = await this.reservationModel.insertMany(reservationsToSave);

      // Auto-extender la serie recurrente para garantizar 3 meses de buffer
      if (savedReservations.length > 0 && savedReservations[0].recurrenceGroupId) {
        try {
          await this.ensureThreeMonthBuffer(savedReservations[0].recurrenceGroupId);
        } catch (bufferError: any) {
          console.error('Auto-extensión de 3 meses parcialmente fallida:', bufferError.message);
        }
      }

      // Enviar confirmación por correo si se proporcionó un email y la reserva está confirmada
      const firstRes = savedReservations[0];
      if (firstRes && firstRes.email && firstRes.status === 'confirmed') {
        this.notificationsService.sendReservationConfirmation(
          firstRes.email,
          firstRes.userId || 'Jugador',
          {
            id: firstRes._id.toString(),
            clubName: court.clubId ? (court.clubId as any).name || 'Club' : 'Club',
            courtName: court.name,
            sport: court.sport,
            date: firstRes.startTime.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
            time: firstRes.startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
            duration: durationHours,
            totalPrice: firstRes.totalPrice,
            depositAmount: firstRes.depositAmount,
          }
        ).catch(err => console.error('Error enviando email automático:', err));
      }

      return savedReservations[0];
    } else {
      const courtOverlapping = await this.reservationModel
        .findOne({
          courtId,
          status: { $ne: 'cancelled' },
          startTime: { $lt: end },
          endTime: { $gt: start },
        })
        .exec();

      if (courtOverlapping) {
        throw new ConflictException(
          'La cancha ya está reservada en este horario.',
        );
      }

      if (createReservationDto.teacherId) {
        const teacherOverlapping = await this.reservationModel
          .findOne({
            teacherId: new Types.ObjectId(createReservationDto.teacherId),
            status: { $ne: 'cancelled' },
            startTime: { $lt: end },
            endTime: { $gt: start },
          })
          .exec();

        if (teacherOverlapping) {
          throw new ConflictException(
            'El profesor seleccionado ya tiene otra clase reservada en este horario.',
          );
        }
      }

      const isPaid = createReservationDto.paymentStatus === 'paid';
      const depositAmount = createReservationDto.depositAmount !== undefined
        ? Number(createReservationDto.depositAmount)
        : (isPaid ? totalPrice : 0);

      const createdReservation = new this.reservationModel({
        ...createReservationDto,
        courtId: new Types.ObjectId(courtId),
        teacherId: createReservationDto.teacherId ? new Types.ObjectId(createReservationDto.teacherId) : undefined,
        teacherPrice,
        startTime: start,
        endTime: end,
        totalPrice,
        depositAmount,
        products: productsList,
        productsPrice,
        paymentStatus: depositAmount >= totalPrice ? 'paid' : 'pending',
        paymentDate: (isPaid || depositAmount > 0) ? new Date() : undefined,
        status: (isPaid || depositAmount > 0) ? 'confirmed' : (createReservationDto.status || 'pending'),
      });

      const saved = await createdReservation.save();

      // Enviar confirmación por correo si se proporcionó un email y la reserva está confirmada
      if (saved.email && saved.status === 'confirmed') {
        this.notificationsService.sendReservationConfirmation(
          saved.email,
          saved.userId || 'Jugador',
          {
            id: saved._id.toString(),
            clubName: court.clubId ? (court.clubId as any).name || 'Club' : 'Club',
            courtName: court.name,
            sport: court.sport,
            date: saved.startTime.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
            time: saved.startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
            duration: durationHours,
            totalPrice: saved.totalPrice,
            depositAmount: saved.depositAmount,
          }
        ).catch(err => console.error('Error enviando email automático:', err));
      }

      return saved;
    }
  }

  async findAll(query?: ReservationQuery): Promise<any[]> {
    let dateFilter = {};

    if (query?.date) {
      const { start, end } = getArgentinaDayRange(query.date);
      dateFilter = {
        $or: [
          {
            startTime: {
              $gte: start,
              $lt: end,
            },
          },
          {
            paymentDate: {
              $gte: start,
              $lt: end,
            },
          },
        ],
      };
    }

    let clubFilter = {};

    if (query?.clubId) {
      if (Array.isArray(query.clubId)) {
        const validClubIds = query.clubId.filter((id) => Types.ObjectId.isValid(id));
        const courtIds = await this.courtModel
          .find({ clubId: { $in: validClubIds.map((id) => new Types.ObjectId(id)) } })
          .distinct('_id')
          .exec();
        clubFilter = {
          courtId: { $in: courtIds },
        };
      } else {
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
    }

    const reservations = await this.reservationModel
      .find({ ...dateFilter, ...clubFilter })
      .populate('courtId')
      .populate('teacherId')
      .sort({ startTime: 1 })
      .exec();

    // Agregar flag 'isLastOfSeries' para identificar el último día reservado por adelantado
    const results = [];
    for (const r of reservations) {
      const plainObj = r.toObject() as any;
      if (r.isRecurring && r.recurrenceGroupId && r.status !== 'cancelled') {
        const futureExists = await this.reservationModel
          .findOne({
            recurrenceGroupId: r.recurrenceGroupId,
            startTime: { $gt: r.startTime },
            status: { $ne: 'cancelled' },
          })
          .exec();
        plainObj.isLastOfSeries = !futureExists;
      } else {
        plainObj.isLastOfSeries = false;
      }
      results.push(plainObj);
    }

    return results;
  }

  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
    callerClubId?: string,
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

    const wasConfirmed = existingReservation.status === 'confirmed';

    let courtPrice = existingReservation.totalPrice - (existingReservation.productsPrice || 0) - (existingReservation.teacherPrice || 0);

    const currentResType = updateReservationDto.reservationType || existingReservation.reservationType;
    const isEscuelita = currentResType === 'escuelita_padel' || currentResType === 'escuelita_futbol';

    const newCourtId = updateReservationDto.courtId || existingReservation.courtId.toString();
    const newStart = updateReservationDto.startTime ? new Date(updateReservationDto.startTime) : new Date(existingReservation.startTime);
    const newEnd = updateReservationDto.endTime ? new Date(updateReservationDto.endTime) : new Date(existingReservation.endTime);
    const hasTimeOrCourtChange = !!(updateReservationDto.courtId || updateReservationDto.startTime || updateReservationDto.endTime);

    if (isEscuelita && hasTimeOrCourtChange) {
      const durationMin = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60));
      if (durationMin !== 60) {
        throw new BadRequestException('Las reservas de escuelita deben ser de exactamente 1 hora.');
      }
    }

    // Validaciones de reprogramación (Rescheduling / Drag and Drop)
    if (hasTimeOrCourtChange) {
      if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime()) || newEnd <= newStart) {
        throw new BadRequestException('El horario de la reserva no es válido.');
      }

      if (!Types.ObjectId.isValid(newCourtId)) {
        throw new BadRequestException('La cancha indicada no es válida.');
      }

      const targetCourt = await this.courtModel.findById(newCourtId).exec();
      if (!targetCourt) {
        throw new NotFoundException('La cancha especificada no existe.');
      }

      // Validar solapamiento de cancha (excluyendo la reserva actual)
      const overlapping = await this.reservationModel
        .findOne({
          _id: { $ne: new Types.ObjectId(id) },
          courtId: newCourtId,
          status: { $ne: 'cancelled' },
          startTime: { $lt: newEnd },
          endTime: { $gt: newStart },
        })
        .exec();

      if (overlapping) {
        throw new ConflictException('La cancha ya se encuentra reservada en el horario seleccionado.');
      }

      // Recalcular precio de la cancha
      const durationHours = (newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60);
      courtPrice = Math.round(durationHours * targetCourt.pricePerHour);
      
      // Actualizar en el DTO
      updateReservationDto.courtId = newCourtId as any;
      updateReservationDto.startTime = newStart;
      updateReservationDto.endTime = newEnd;
    }

    const durationHours = (newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60);

    let teacherPrice = existingReservation.teacherPrice || 0;

    if (updateReservationDto.teacherId === null || updateReservationDto.teacherId === '') {
      updateReservationDto.teacherId = null;
      updateReservationDto.teacherPrice = 0;
      teacherPrice = 0;
    } else {
      const teacherIdToUse = updateReservationDto.teacherId || existingReservation.teacherId?.toString();
      if (teacherIdToUse) {
        const teacher = await this.teacherModel.findById(teacherIdToUse).exec();
        if (!teacher) {
          throw new NotFoundException('El profesor especificado no existe.');
        }

        this.validateTeacherAvailability(teacher, newStart, newEnd);

        // Check teacher overlap
        const teacherOverlapping = await this.reservationModel.findOne({
          _id: { $ne: new Types.ObjectId(id) },
          teacherId: new Types.ObjectId(teacherIdToUse),
          status: { $ne: 'cancelled' },
          startTime: { $lt: newEnd },
          endTime: { $gt: newStart },
        }).exec();

        if (teacherOverlapping) {
          throw new ConflictException('El profesor seleccionado ya tiene otra clase reservada en este horario.');
        }


        teacherPrice = Math.round(durationHours * teacher.pricePerHour);
        updateReservationDto.teacherId = new Types.ObjectId(teacherIdToUse) as any;
        updateReservationDto.teacherPrice = teacherPrice;
      }
    }

    let productsPrice = existingReservation.productsPrice || 0;
    let productsList = existingReservation.products || [];

    if (updateReservationDto.products) {
      productsList = updateReservationDto.products.map(p => {
        const qty = Number(p.quantity) || 1;
        const prc = Number(p.price) || 0;
        return {
          name: p.name,
          quantity: qty,
          price: prc,
          total: qty * prc
        } as any;
      });
      productsPrice = productsList.reduce((sum, item) => sum + item.total, 0);
      updateReservationDto.products = productsList;
      updateReservationDto.productsPrice = productsPrice;
    }

    const hasTeacher = updateReservationDto.teacherId !== null &&
      (updateReservationDto.teacherId !== undefined || !!existingReservation.teacherId);

    const updatedTotalPrice = hasTeacher
      ? (teacherPrice + productsPrice)
      : (courtPrice + productsPrice);
    updateReservationDto.totalPrice = updatedTotalPrice;


    // Determine the deposit amount
    let finalDeposit = existingReservation.depositAmount;
    if (updateReservationDto.depositAmount !== undefined) {
      finalDeposit = updateReservationDto.depositAmount;
    }

    // If they explicitly send paymentStatus = 'paid', we set depositAmount to updatedTotalPrice
    if (updateReservationDto.paymentStatus === 'paid') {
      finalDeposit = updatedTotalPrice;
      updateReservationDto.depositAmount = updatedTotalPrice;
    }

    // Compare deposit amount with total price
    if (finalDeposit >= updatedTotalPrice) {
      updateReservationDto.paymentStatus = 'paid';
    } else {
      updateReservationDto.paymentStatus = 'pending';
    }

    const hasNewPayment = 
      (updateReservationDto.paymentStatus === 'paid' && existingReservation.paymentStatus !== 'paid') ||
      (updateReservationDto.depositAmount !== undefined && updateReservationDto.depositAmount !== existingReservation.depositAmount);

    if (hasNewPayment) {
      updateReservationDto.paymentDate = new Date();
    }

    if (callerClubId) {
      const court = await this.courtModel.findById(existingReservation.courtId).exec();
      if (!court || court.clubId.toString() !== callerClubId) {
        throw new BadRequestException('No tienes permiso para actualizar esta reserva.');
      }
    }

    if (updateReservationDto.userId !== undefined) {
      updateReservationDto.firstName = '';
      updateReservationDto.lastName = '';

      if (existingReservation.isRecurring && existingReservation.recurrenceGroupId) {
        await this.reservationModel
          .updateMany(
            {
              recurrenceGroupId: existingReservation.recurrenceGroupId,
              startTime: { $gte: existingReservation.startTime },
            },
            {
              $set: {
                userId: updateReservationDto.userId,
                firstName: '',
                lastName: '',
              },
            },
          )
          .exec();
      }
    }

    // Confirmación automática: si se registra el pago, se confirma la reserva
    if (
      updateReservationDto.paymentStatus === 'paid' &&
      existingReservation.status !== 'cancelled' &&
      (!updateReservationDto.status || updateReservationDto.status === 'pending')
    ) {
      updateReservationDto.status = 'confirmed';
    }

    // No se permite cancelar reservas que ya comenzaron o pasaron de horario
    if (updateReservationDto.status === 'cancelled') {
      const now = new Date();
      const startTime = new Date(existingReservation.startTime);
      if (startTime < now) {
        throw new BadRequestException(
          'No se puede cancelar una reserva que ya ha comenzado o cuya fecha/hora de inicio ya ha pasado.',
        );
      }
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

    // Pago en bloque para series recurrentes con 10% de descuento
    if (
      updateReservationDto.paymentStatus === 'paid' &&
      updateReservationDto.payBlock === true &&
      existingReservation.isRecurring &&
      existingReservation.recurrenceGroupId
    ) {
      const sortedGroup = await this.reservationModel
        .find({
          recurrenceGroupId: existingReservation.recurrenceGroupId,
          status: { $ne: 'cancelled' },
        })
        .sort({ startTime: 1 })
        .exec();

      const index = sortedGroup.findIndex(
        (r) => r._id.toString() === existingReservation._id.toString(),
      );

      if (index !== -1) {
        const blockIndex = Math.floor(index / 4);
        const startBlockIndex = blockIndex * 4;
        const endBlockIndex = startBlockIndex + 4;
        const blockReservations = sortedGroup.slice(startBlockIndex, endBlockIndex);

        for (const res of blockReservations) {
          const court = await this.courtModel.findById(res.courtId).exec();
          if (court) {
            const durationMs = res.endTime.getTime() - res.startTime.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            const originalPrice = Math.round(durationHours * court.pricePerHour);
            const discountedPrice = Math.round(originalPrice * 0.90); // 10% de descuento por mes completo

            await this.reservationModel
              .findByIdAndUpdate(res._id, {
                status: 'confirmed',
                paymentStatus: 'paid',
                totalPrice: discountedPrice,
                depositAmount: discountedPrice,
                paymentDate: new Date(),
              })
              .exec();
          }
        }

        // Verificar si este bloque que se acaba de pagar era el final de la serie activa.
        // Si no existen reservas futuras activas después de la última reserva de este bloque,
        // entonces renovamos automáticamente las siguientes 4 semanas en estado 'pending' (por adelantado).
        const lastResOfBlock = blockReservations[blockReservations.length - 1];
        const futureExists = await this.reservationModel
          .findOne({
            recurrenceGroupId: existingReservation.recurrenceGroupId,
            startTime: { $gt: lastResOfBlock.startTime },
            status: { $ne: 'cancelled' },
          })
          .exec();

        // Auto-extender la serie para garantizar 3 meses de buffer
        try {
          await this.ensureThreeMonthBuffer(existingReservation.recurrenceGroupId);
        } catch (bufferError: any) {
          console.error('Auto-extensión de 3 meses parcialmente fallida:', bufferError.message);
        }

        const updated = await this.reservationModel
          .findById(id)
          .populate('courtId')
          .exec();

        if (updated && updated.email && !wasConfirmed && updated.status === 'confirmed') {
          const court = await this.courtModel
            .findById(updated.courtId)
            .populate('clubId')
            .exec();
          if (court) {
            const durationHours = (updated.endTime.getTime() - updated.startTime.getTime()) / (1000 * 60 * 60);
            this.notificationsService.sendReservationConfirmation(
              updated.email,
              updated.userId || 'Jugador',
              {
                id: updated._id.toString(),
                clubName: court.clubId ? (court.clubId as any).name || 'Club' : 'Club',
                courtName: court.name,
                sport: court.sport,
                date: updated.startTime.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
                time: updated.startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
                duration: durationHours,
                totalPrice: updated.totalPrice,
                depositAmount: updated.depositAmount,
              }
            ).catch(err => console.error('Error enviando email en actualización de reserva:', err));
          }
        }
        return updated;
      }
    }

    const updated = await this.reservationModel
      .findByIdAndUpdate(id, updateReservationDto, { new: true })
      .populate('courtId')
      .exec();

    // Auto-extender series recurrentes cuando se paga (todos los tipos, no solo escuelita)
    const isNowPaid = updated && updated.paymentStatus === 'paid' && existingReservation.paymentStatus !== 'paid';
    if (isNowPaid && updated.isRecurring && updated.recurrenceGroupId) {
      try {
        await this.ensureThreeMonthBuffer(updated.recurrenceGroupId);
      } catch (bufferError: any) {
        console.error('Auto-extensión de 3 meses parcialmente fallida:', bufferError.message);
      }
    }

    if (updated && updated.email && !wasConfirmed && updated.status === 'confirmed') {
      const court = await this.courtModel
        .findById(updated.courtId)
        .populate('clubId')
        .exec();
      if (court) {
        const durationHours = (updated.endTime.getTime() - updated.startTime.getTime()) / (1000 * 60 * 60);
        this.notificationsService.sendReservationConfirmation(
          updated.email,
          updated.userId || 'Jugador',
          {
            id: updated._id.toString(),
            clubName: court.clubId ? (court.clubId as any).name || 'Club' : 'Club',
            courtName: court.name,
            sport: court.sport,
            date: updated.startTime.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
            time: updated.startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
            duration: durationHours,
            totalPrice: updated.totalPrice,
            depositAmount: updated.depositAmount,
          }
        ).catch(err => console.error('Error enviando email en actualización de reserva:', err));
      }
    }

    return updated;
  }

  async renew(id: string, callerClubId?: string): Promise<Reservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('La reserva indicada no es válida.');
    }

    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada.');
    }

    if (callerClubId) {
      const court = await this.courtModel.findById(reservation.courtId).exec();
      if (!court || court.clubId.toString() !== callerClubId) {
        throw new BadRequestException('No tienes permiso para renovar esta reserva.');
      }
    }

    if (!reservation.isRecurring || !reservation.recurrenceGroupId) {
      throw new BadRequestException('Esta reserva no forma parte de un turno fijo recurrente.');
    }

    // Asegurar el buffer de 3 meses para el grupo
    const createdReservations = await this.ensureThreeMonthBuffer(reservation.recurrenceGroupId);

    // Si se crearon nuevas, devolvemos la primera. Si no, la original.
    return createdReservations.length > 0 ? createdReservations[0] : reservation;
  }

  async ensureThreeMonthBuffer(recurrenceGroupId: string): Promise<ReservationDocument[]> {
    const group = await this.reservationModel
      .find({ recurrenceGroupId, status: { $ne: 'cancelled' } })
      .sort({ startTime: 1 })
      .exec();

    if (group.length === 0) {
      return [];
    }

    const lastRes = group[group.length - 1];
    const court = await this.courtModel.findById(lastRes.courtId).exec();
    if (!court) {
      throw new NotFoundException('La cancha especificada no existe.');
    }

    const lastStart = new Date(lastRes.startTime);
    const lastEnd = new Date(lastRes.endTime);
    const durationMs = lastEnd.getTime() - lastStart.getTime();

    const now = new Date();
    // 12 semanas (3 meses de buffer)
    const targetTime = now.getTime() + 12 * 7 * 24 * 60 * 60 * 1000;

    if (lastStart.getTime() >= targetTime) {
      return [];
    }

    const weeksToCreate: { start: Date; end: Date }[] = [];
    let currentWeekStart = new Date(lastStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    while (currentWeekStart.getTime() <= targetTime) {
      const weekStart = new Date(currentWeekStart);
      const weekEnd = new Date(weekStart.getTime() + durationMs);

      // Verificar si ya existe una reserva del grupo en esa semana exacta
      const existingInGroup = await this.reservationModel.findOne({
        recurrenceGroupId,
        status: { $ne: 'cancelled' },
        startTime: weekStart,
      }).exec();

      if (existingInGroup) {
        currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        continue;
      }

      // Verificar solapamiento de cancha
      const courtOverlapping = await this.reservationModel.findOne({
        courtId: lastRes.courtId,
        status: { $ne: 'cancelled' },
        startTime: { $lt: weekEnd },
        endTime: { $gt: weekStart },
      }).exec();

      // Verificar solapamiento de profesor
      let teacherOverlapping = null;
      if (lastRes.teacherId) {
        teacherOverlapping = await this.reservationModel.findOne({
          teacherId: lastRes.teacherId,
          status: { $ne: 'cancelled' },
          startTime: { $lt: weekEnd },
          endTime: { $gt: weekStart },
        }).exec();
      }

      if (courtOverlapping || teacherOverlapping) {
        console.log(
          `[ensureThreeMonthBuffer] Saltando semana ${weekStart.toISOString()} por solapamiento. Cancha: ${!!courtOverlapping}, Profesor: ${!!teacherOverlapping}`
        );
      } else {
        weeksToCreate.push({ start: weekStart, end: weekEnd });
      }

      currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    if (weeksToCreate.length === 0) {
      return [];
    }

    const durationHours = durationMs / (1000 * 60 * 60);
    const hasTeacher = lastRes.teacherId !== null && lastRes.teacherId !== undefined;
    const totalPrice = hasTeacher
      ? (lastRes.teacherPrice || 0)
      : Math.round(durationHours * court.pricePerHour);

    const reservationsToSave = weeksToCreate.map((week) => {
      return new this.reservationModel({
        courtId: lastRes.courtId,
        userId: lastRes.userId,
        firstName: lastRes.firstName,
        lastName: lastRes.lastName,
        email: lastRes.email,
        phone: lastRes.phone,
        isPublic: lastRes.isPublic || false,
        startTime: week.start,
        endTime: week.end,
        totalPrice,
        paymentStatus: 'pending',
        isRecurring: true,
        recurrenceGroupId,
        reservationType: lastRes.reservationType || 'standard',
        status: 'pending',
        teacherId: lastRes.teacherId || undefined,
        teacherPrice: lastRes.teacherPrice || 0,
        students: lastRes.students || [],
      });
    });

    const saved = await this.reservationModel.insertMany(reservationsToSave);
    return saved as any[];
  }

  async findOne(id: string): Promise<Reservation | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.reservationModel.findById(id).populate('courtId').exec();
  }
}
