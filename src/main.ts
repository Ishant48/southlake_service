import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Graceful shutdown: let TypeORM/other modules close connections and
  // in-flight requests finish on SIGTERM (rolling deploys / scale-down)
  app.enableShutdownHooks();

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global snake_case response transform + request timeout
  app.useGlobalInterceptors(new SnakeCaseInterceptor(), new TimeoutInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Southlake Insurance - User Management API')
    .setDescription('IAM backend service for Southlake Insurance Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.warn(`Application is running on: http://localhost:${port}`);
  console.warn(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

void bootstrap();
