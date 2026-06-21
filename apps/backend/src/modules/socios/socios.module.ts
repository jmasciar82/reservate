import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SociosController } from './socios.controller';
import { SociosService } from './socios.service';
import { Socio, SocioSchema } from './schemas/socio.schema';
import { ClubsModule } from '../clubs/clubs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Socio.name, schema: SocioSchema }]),
    ClubsModule,
  ],
  controllers: [SociosController],
  providers: [SociosService],
  exports: [SociosService],
})
export class SociosModule {}
