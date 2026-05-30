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

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly clubsService: ClubsService,
    private readonly courtsService: CourtsService,
  ) {}

  @Post()
  async create(@Body() createReservationDto: CreateReservationDto, @Request() req: any) {
    const user = req.user;
    if (user.role === 'club_owner') {
      const court = await this.courtsService.findOne(createReservationDto.courtId);
      if (!court) {
        throw new ForbiddenException('La cancha especificada no existe.');
      }
      const club = await this.clubsService.findOne(court.clubId.toString());
      if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
        throw new ForbiddenException('No tienes permiso para reservar en esta cancha.');
      }
      return this.reservationsService.create(createReservationDto);
    } else if (user.role === 'staff') {
      return this.reservationsService.create(createReservationDto, user.clubId);
    }
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('date') date?: string,
    @Query('clubId') clubId?: string,
  ) {
    const user = req.user;
    if (user.role === 'club_owner') {
      if (clubId) {
        const club = await this.clubsService.findOne(clubId);
        if (!club || club.tenantId?.toString() !== user.tenantId?.toString()) {
          throw new ForbiddenException('No tienes permiso para consultar reservas de este club.');
        }
        return this.reservationsService.findAll({ date, clubId });
      } else {
        if (!user.tenantId) return [];
        const clubs = await this.clubsService.findByTenant(user.tenantId);
        const clubIds = clubs.map((c: any) => c._id.toString());
        return this.reservationsService.findAll({ date, clubId: clubIds });
      }
    } else if (user.role === 'staff') {
      return this.reservationsService.findAll({ date, clubId: user.clubId });
    }
    return this.reservationsService.findAll({ date, clubId });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @Request() req: any,
  ) {
    const user = req.user;
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
      return this.reservationsService.update(id, updateReservationDto);
    } else if (user.role === 'staff') {
      return this.reservationsService.update(id, updateReservationDto, user.clubId);
    }
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Post(':id/renew')
  async renew(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
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
      return this.reservationsService.renew(id);
    } else if (user.role === 'staff') {
      return this.reservationsService.renew(id, user.clubId);
    }
    return this.reservationsService.renew(id);
  }
}
