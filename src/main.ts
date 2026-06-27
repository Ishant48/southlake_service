import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';
import { QueuePriority } from './common/queues/priority/queue-priority.enum';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Security ─────────────────────────────────────────────────────────────
  app.use(helmet());

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });

  // ─── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Global validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ─── Global exception filter ──────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Global snake_case response transform ─────────────────────────────────
  app.useGlobalInterceptors(new SnakeCaseInterceptor());

  // ─── Bull Board dashboard ─────────────────────────────────────────────────
  const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };

  const bullBoardPath = process.env.BULL_BOARD_PATH || '/admin/queues';
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(bullBoardPath);

  const allQueues = Object.values(QueuePriority).map(
    name => new BullMQAdapter(new Queue(name, { connection: redisConnection })),
  );

  createBullBoard({ queues: allQueues, serverAdapter });

  // Basic auth protection for the dashboard
  const boardUser = process.env.BULL_BOARD_USERNAME || 'admin';
  const boardPass = process.env.BULL_BOARD_PASSWORD || 'admin';

  app.use(bullBoardPath, (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers['authorization'];
    if (!auth) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      return res.status(401).send('Authentication required');
    }
    const [, encoded] = auth.split(' ');
    const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
    if (user !== boardUser || pass !== boardPass) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      return res.status(401).send('Invalid credentials');
    }
    next();
  });

  app.use(bullBoardPath, serverAdapter.getRouter());

  // ─── Swagger (disabled in production) ────────────────────────────────────
  const swaggerPath = 'api/docs';
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Southlake Insurance – User Management API')
      .setDescription('IAM backend service for Southlake Insurance Platform')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'SessionToken' },
        'session-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // ─── Start ────────────────────────────────────────────────────────────────
  const port = process.env.PORT || 3000;
  await app.listen(port);

  const base = `http://localhost:${port}`;
  logger.log(`Service    → ${base}/api`);
  logger.log(
    `Swagger    → ${isProduction ? '(disabled in production)' : `${base}/${swaggerPath}`}`,
  );
  logger.log(`Bull Board → ${base}${bullBoardPath}  (user: ${boardUser})`);
}

bootstrap();
