import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ClubsService } from '../clubs/clubs.service';
import { CourtsService } from '../courts/courts.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly clubsService: ClubsService,
    private readonly courtsService: CourtsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post()
  async create(@Body() createReservationDto: CreateReservationDto, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    let result: any;
    if (user.role === 'club_owner') {
      const court = await this.courtsService.findOne(createReservationDto.courtId);
      if (!court) {
        throw new ForbiddenException('La cancha especificada no existe.');
      }
      const club = await this.clubsService.findOne(court.clubId.toString());
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permiso para reservar en esta cancha.');
      }
      result = await this.reservationsService.create(createReservationDto);
    } else if (user.role === 'staff') {
      result = await this.reservationsService.create(createReservationDto, user.clubId);
    } else {
      result = await this.reservationsService.create(createReservationDto);
    }

    // Registrar acción en auditoría
    try {
      await this.auditLogsService.logAction({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'create_reservation',
        targetType: 'reservation',
        targetId: result._id.toString(),
        clubId: result.courtId?.clubId ?? result.courtId,
        tenantId: user.tenantId,
        details: {
          startTime: result.startTime,
          endTime: result.endTime,
          totalPrice: result.totalPrice,
          depositAmount: result.depositAmount,
          paymentStatus: result.paymentStatus,
          firstName: result.firstName,
          lastName: result.lastName,
          isRecurring: result.isRecurring,
          products: result.products,
          productsPrice: result.productsPrice,
        },
      });
    } catch (e) {
      console.error('Error writing audit log:', e);
    }

    return result;
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('date') date?: string,
    @Query('clubId') clubId?: string,
    @Query('type') type?: string,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    if (user.role === 'club_owner') {
      if (clubId) {
        const club = await this.clubsService.findOne(clubId);
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('No tienes permiso para consultar reservas de este club.');
        }
        return this.reservationsService.findAll({ date, clubId, type });
      } else {
        if (!user.tenantId) return [];
        const clubs = await this.clubsService.findByTenant(user.tenantId);
        const clubIds = clubs.map((c: any) => c._id.toString());
        return this.reservationsService.findAll({ date, clubId: clubIds, type });
      }
    } else if (user.role === 'staff') {
      return this.reservationsService.findAll({ date, clubId: user.clubId, type });
    }
    return this.reservationsService.findAll({ date, clubId, type });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    let result: any;
    if (user.role === 'club_owner') {
      const reservation = await this.reservationsService.findOne(id);
      if (!reservation) {
        throw new ForbiddenException('La reserva especificada no existe.');
      }
      const court = await this.courtsService.findOne(reservation.courtId.toString());
      if (!court) {
        throw new ForbiddenException('La cancha de la reserva no existe.');
      }
      const club = await this.clubsService.findOne(court.clubId.toString());
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permiso para actualizar esta reserva.');
      }
      result = await this.reservationsService.update(id, updateReservationDto);
    } else if (user.role === 'staff') {
      result = await this.reservationsService.update(id, updateReservationDto, user.clubId);
    } else {
      result = await this.reservationsService.update(id, updateReservationDto);
    }

    // Registrar acción en auditoría
    try {
      const isCancellation = updateReservationDto.status === 'cancelled';
      const isRescheduling = updateReservationDto.courtId || updateReservationDto.startTime || updateReservationDto.endTime;
      const isPaymentUpdate = updateReservationDto.paymentStatus || updateReservationDto.depositAmount !== undefined;

      let action = 'update_reservation';
      if (isCancellation) action = 'cancel_reservation';
      else if (isRescheduling) action = 'reschedule_reservation';
      else if (isPaymentUpdate) action = 'payment_reservation';

      await this.auditLogsService.logAction({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action,
        targetType: 'reservation',
        targetId: id,
        clubId: result?.courtId?.clubId ?? result?.courtId,
        tenantId: user.tenantId,
        details: {
          changes: updateReservationDto,
          newValues: {
            status: result?.status,
            paymentStatus: result?.paymentStatus,
            startTime: result?.startTime,
            endTime: result?.endTime,
            courtId: result?.courtId?._id ?? result?.courtId,
            totalPrice: result?.totalPrice,
            depositAmount: result?.depositAmount,
            products: result?.products,
            productsPrice: result?.productsPrice,
          }
        },
      });
    } catch (e) {
      console.error('Error writing audit log:', e);
    }

    return result;
  }

  @Post(':id/renew')
  async renew(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'club_owner' && user.role !== 'staff') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    let result: any;
    if (user.role === 'club_owner') {
      const reservation = await this.reservationsService.findOne(id);
      if (!reservation) {
        throw new ForbiddenException('La reserva especificada no existe.');
      }
      const court = await this.courtsService.findOne(reservation.courtId.toString());
      if (!court) {
        throw new ForbiddenException('La cancha de la reserva no existe.');
      }
      const club = await this.clubsService.findOne(court.clubId.toString());
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permiso para renovar esta reserva.');
      }
      result = await this.reservationsService.renew(id);
    } else if (user.role === 'staff') {
      result = await this.reservationsService.renew(id, user.clubId);
    } else {
      result = await this.reservationsService.renew(id);
    }

    // Registrar acción en auditoría
    try {
      await this.auditLogsService.logAction({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'renew_reservation',
        targetType: 'reservation',
        targetId: id,
        clubId: result?.courtId?.clubId ?? result?.courtId,
        tenantId: user.tenantId,
        details: {
          description: 'Renovación de 4 semanas para turno fijo'
        },
      });
    } catch (e) {
      console.error('Error writing audit log:', e);
    }

    return result;
  }
}
