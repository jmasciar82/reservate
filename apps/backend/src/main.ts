import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dns from 'dns';
import * as https from 'https';

// Forzar la resolución de DNS a dar prioridad a IPv4 sobre IPv6. 
// Esto es CRUCIAL en Render para evitar errores connect ENETUNREACH con servicios externos como Gmail (IPv6 no soportado de salida).
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
  }));

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

  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL) {
    console.log(`🟢 Auto-ping configurado para la URL: ${RENDER_URL}`);
    setInterval(() => {
      https.get(`${RENDER_URL}/api/health`, (res) => {
        console.log(`Self-ping exitoso: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('Self-ping fallido:', err.message);
      });
    }, 10 * 60 * 1000); // Cada 10 minutos
  }

  await app.listen(3001);
}

bootstrap();