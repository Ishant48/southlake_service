import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('App (smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/database/check-itd-seeded (GET) - Success 200', () => {
    return request(app.getHttpServer())
      .get('/api/database/check-itd-seeded')
      .expect(200);
  });

  it('/api/database/seeder-files (GET) - Success 200', () => {
    return request(app.getHttpServer())
      .get('/api/database/seeder-files')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
