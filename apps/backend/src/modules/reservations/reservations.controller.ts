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
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  async create(@Body() createReservationDto: CreateReservationDto, @Request() req: any) {
    const user = req.user;
    const callerClubId = (user.role === 'club_owner' || user.role === 'staff') ? user.clubId : undefined;
    return this.reservationsService.create(createReservationDto, callerClubId);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('date') date?: string,
    @Query('clubId') clubId?: string,
  ) {
    const user = req.user;
    let targetClubId = clubId;
    if (user.role === 'club_owner' || user.role === 'staff') {
      targetClubId = user.clubId;
    }
    return this.reservationsService.findAll({ date, clubId: targetClubId });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @Request() req: any,
  ) {
    const user = req.user;
    const callerClubId = (user.role === 'club_owner' || user.role === 'staff') ? user.clubId : undefined;
    return this.reservationsService.update(id, updateReservationDto, callerClubId);
  }

  @Post(':id/renew')
  async renew(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    const callerClubId = (user.role === 'club_owner' || user.role === 'staff') ? user.clubId : undefined;
    return this.reservationsService.renew(id, callerClubId);
  }
}
