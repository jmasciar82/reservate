import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
 
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
