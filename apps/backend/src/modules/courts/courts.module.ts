import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';
import { Court, CourtSchema } from './schemas/court.schema';
import {
  Reservation,
  ReservationSchema,
} from '../reservations/schemas/reservation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Court.name, schema: CourtSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
})
export class CourtsModule {}
