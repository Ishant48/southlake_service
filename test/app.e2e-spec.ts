import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { SnakeCaseInterceptor } from '../src/common/interceptors/snake-case.interceptor';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new SnakeCaseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 404 for unknown routes', () => {
    return request(app.getHttpServer()).get('/api/non-existent-route').expect(404);
  });

  it('should return 401 when accessing protected route without token', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('should reject login with missing body', () => {
    return request(app.getHttpServer()).post('/api/auth/login').send({}).expect(400);
  });
});
