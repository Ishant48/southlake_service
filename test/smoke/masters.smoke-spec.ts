import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Masters (smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  const masterRoutes = [
    '/api/masters/states',
    '/api/masters/mgas',
    '/api/masters/reinsurers',
    '/api/masters/brokers',
    '/api/masters/risk-companies',
    '/api/masters/products'
  ];

  masterRoutes.forEach(route => {
    it(`GET ${route} - Unauthorized without token`, () => {
      return request(app.getHttpServer())
        .get(route)
        .expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
