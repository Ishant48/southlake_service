import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Reports (smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/financial-reports/balance-sheet (GET) - Unauthorized without token', () => {
    return request(app.getHttpServer())
      .get('/api/financial-reports/balance-sheet')
      .expect(401);
  });

  it('/api/financial-reports/pl (GET) - Unauthorized without token', () => {
    return request(app.getHttpServer())
      .get('/api/financial-reports/pl')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
