import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { JournalEntryBatch } from '../../src/modules/journal-entries/entities/journal-entry-batch.entity';

describe('JournalEntries (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let authToken: string;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // Log in programmatically
    const otpRepo = moduleFixture.get(getRepositoryToken(LoginOtp));
    await otpRepo.createQueryBuilder().delete().execute();

    const sessionRepo = moduleFixture.get(getRepositoryToken(UserSession));
    await sessionRepo.manager.query('DELETE FROM "login_challenges"');
    await sessionRepo.createQueryBuilder().delete().execute();

    const mailService = moduleFixture.get(MailService);
    let sentOtp = '';
    const spy = jest.spyOn(mailService, 'sendOtp').mockImplementation(async (email, otp) => {
      sentOtp = otp;
    });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@southlake.com', password: 'Admin@123' })
      .expect(200);

    const verifyRes = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ email: 'admin@southlake.com', otp: sentOtp, device_label: 'E2E Test' })
      .expect(200);

    authToken = verifyRes.body.session_token;
    spy.mockRestore();
  });

  afterAll(async () => {
    // Cleanup E2E batches
    const batchRepo = moduleFixture.get(getRepositoryToken(JournalEntryBatch));
    await batchRepo.delete({ agentName: 'E2E-TEST-AGENT' });
    await app.close();
  });

  it('Perform Journal Entry Batch CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/api/journal-batches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        period: 'June 2026',
        agent_name: 'E2E-TEST-AGENT',
        batch_number: 'E2E-123'
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    const batchId = createRes.body.id;

    // 2. Read (list)
    const listRes = await request(app.getHttpServer())
      .get('/api/journal-batches')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listRes.body.some((b: any) => b.id === batchId)).toBe(true);

    // 3. Read (one)
    const detailRes = await request(app.getHttpServer())
      .get(`/api/journal-batches/${batchId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(detailRes.body.agentName).toBe('E2E-TEST-AGENT');

    // 4. Update
    await request(app.getHttpServer())
      .patch(`/api/journal-batches/${batchId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        agent_name: 'E2E-TEST-AGENT',
        period: 'July 2026'
      })
      .expect(200);

    // 5. Delete
    await request(app.getHttpServer())
      .delete(`/api/journal-batches/${batchId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
