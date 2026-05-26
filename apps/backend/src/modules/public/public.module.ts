import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { Club, ClubSchema } from '../clubs/schemas/club.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Club.name, schema: ClubSchema },
      { name: Court.name, schema: CourtSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
