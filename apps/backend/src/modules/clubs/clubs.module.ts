import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';
import { Club, ClubSchema } from './schemas/club.schema';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Club.name, schema: ClubSchema }]),
    AuditLogsModule,
  ],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [MongooseModule, ClubsService],
})
export class ClubsModule {}
