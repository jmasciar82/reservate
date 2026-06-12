import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';
import { Teacher, TeacherSchema } from '../teachers/schemas/teacher.schema';

import { ClubsModule } from '../clubs/clubs.module';
import { CourtsModule } from '../courts/courts.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Court.name, schema: CourtSchema },
      { name: Teacher.name, schema: TeacherSchema },
    ]),
    ClubsModule,
    CourtsModule,
    AuditLogsModule,
    NotificationsModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
