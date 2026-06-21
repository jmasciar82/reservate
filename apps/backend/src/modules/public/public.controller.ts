import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { CreatePublicReservationDto } from './dto/create-public-reservation.dto';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('clubs')
  async getClubs() {
    return this.publicService.getClubs();
  }

  @Get('clubs/by-domain')
  async getClubByDomain(@Query('hostname') hostname: string) {
    return this.publicService.findOneByDomain(hostname);
  }

  @Get('courts/available')
  async getAvailableCourts(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('clubId') clubId?: string,
  ) {
    return this.publicService.getAvailableCourts(startTime, endTime, clubId);
  }

  @Post('reservations')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async createPublicReservation(@Body() dto: CreatePublicReservationDto) {
    return this.publicService.createPublicReservation(dto);
  }

  @Post('payments/webhook')
  async handleWebhook(
    @Body() body: any,
    @Query('reservation_id') reservationId?: string,
  ) {
    return this.publicService.handleWebhook(body, reservationId);
  }

  @Post('reservations/:id/confirm')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: { paymentId: string; status: string },
    @Query('token') token?: string,
  ) {
    return this.publicService.confirmReservation(id, body.paymentId, body.status, token, false);
  }
}
