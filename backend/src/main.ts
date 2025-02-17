import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);
  const backendPort = configService.get('BACKEND_PORT');
  const frontendPort = configService.get('FRONTEND_PORT');

  if (!backendPort || !frontendPort) {
    logger.error('PORT and FRONT_PORT must be defined in .env');
    process.exit(1);
  }

  app.enableCors({
    origin: [`http://localhost:${frontendPort}`, 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(backendPort ?? 3000);
}
bootstrap();
