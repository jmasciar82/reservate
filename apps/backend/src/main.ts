import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dns from 'dns';

// Forzar la resolución de DNS a dar prioridad a IPv4 sobre IPv6. 
// Esto es CRUCIAL en Render para evitar errores connect ENETUNREACH con servicios externos como Gmail (IPv6 no soportado de salida).
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl = process.env.FRONTEND_URL || '';
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002',
  ];

  if (frontendUrl) {
    // Support comma-separated URLs in FRONTEND_URL
    frontendUrl.split(',').forEach((url) => {
      const cleanUrl = url.trim().replace(/\/$/, '');
      if (cleanUrl) allowedOrigins.push(cleanUrl);
    });
  }

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Check exact match
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any *.vercel.app subdomain
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      // Reject
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  });

  await app.listen(3001);
}

bootstrap();