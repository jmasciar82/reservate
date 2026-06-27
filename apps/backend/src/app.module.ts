import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { CourtsModule } from './modules/courts/courts.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PublicModule } from './modules/public/public.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { ProductsModule } from './modules/products/products.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { SociosModule } from './modules/socios/socios.module';
 
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,    // 1 minuto
      limit: 100,    // max 100 requests por minuto
    }, {
      name: 'long',
      ttl: 600000,   // 10 minutos
      limit: 500,    // max 500 requests cada 10 minutos
    }]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI') ??
                    configService.get<string>('MONGODB_URI');
        
        if (!uri) {
          console.warn('⚠️ ALERTA DE PRODUCCION: No se detectó MONGO_URI ni MONGODB_URI en las variables de entorno de Render. Se usará el valor local por defecto.');
        } else {
          // Ocultar password por seguridad al loguear la URI
          const sanitizedUri = uri.replace(/\/\/.*@/, '//****:****@');
          console.log(`🔌 Base de datos configurada correctamente. Conectando a: ${sanitizedUri}`);
        }
 
        return {
          uri: uri ?? 'mongodb://localhost:27017/reservate',
        };
      },
      inject: [ConfigService],
    }),
    ReservationsModule,
    CourtsModule,
    ClubsModule,
    AuthModule,
    UsersModule,
    PublicModule,
    WhatsappModule,
    AnalyticsModule,
    TenantsModule,
    AuditLogsModule,
    TournamentsModule,
    ProductsModule,
    TeachersModule,
    SociosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
