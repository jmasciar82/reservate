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
  async handleWebhook(@Body() body: any) {
    return this.publicService.handleWebhook(body);
  }

  @Post('reservations/:id/confirm')
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: { paymentId: string; status: string },
  ) {
    return this.publicService.confirmReservation(id, body.paymentId, body.status);
  }
}
