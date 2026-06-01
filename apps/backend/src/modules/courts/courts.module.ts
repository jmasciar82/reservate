import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';
import { Court, CourtSchema } from './schemas/court.schema';
import {
  Reservation,
  ReservationSchema,
} from '../reservations/schemas/reservation.schema';

import { ClubsModule } from '../clubs/clubs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Court.name, schema: CourtSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    ClubsModule,
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [MongooseModule, CourtsService],
})
export class CourtsModule {}
