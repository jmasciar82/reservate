import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';

import { ClubsModule } from '../clubs/clubs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Court.name, schema: CourtSchema },
    ]),
    ClubsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
