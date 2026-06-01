import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl = process.env.FRONTEND_URL || '';
  const origins = [
    'http://localhost:3000',
    'http://localhost:3002',
  ];

  if (frontendUrl) {
    const cleanUrl = frontendUrl.trim().replace(/\/$/, '');
    origins.push(cleanUrl);
  }

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  await app.listen(3001);
}

bootstrap();