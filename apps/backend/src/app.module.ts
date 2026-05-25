import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { CourtsModule } from './modules/courts/courts.module';
import { ClubsModule } from './modules/clubs/clubs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ??
          'mongodb://localhost:27017/reservate',
      }),
      inject: [ConfigService],
    }),
    ReservationsModule,
    CourtsModule,
    ClubsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
