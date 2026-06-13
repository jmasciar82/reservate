import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateReservationDto } from '../reservations/dto/create-reservation.dto';

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
  async createPublicReservation(@Body() dto: CreateReservationDto) {
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
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: { paymentId: string; status: string },
  ) {
    return this.publicService.confirmReservation(id, body.paymentId, body.status);
  }
}
