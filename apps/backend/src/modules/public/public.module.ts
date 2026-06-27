import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          if (isProduction) {
            throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
          } else {
            console.warn('⚠️ [WARNING]: JWT_SECRET is not configured. Using fallback in local development.');
          }
        }
        return {
          secret: secret || 'super-secret-key',
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
