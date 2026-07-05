import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('JournalEntry (smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/journal-batches (GET) - Unauthorized without token', () => {
    return request(app.getHttpServer())
      .get('/api/journal-batches')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
