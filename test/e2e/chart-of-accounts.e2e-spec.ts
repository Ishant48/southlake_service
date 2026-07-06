import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { ChartOfAccount } from '../../src/modules/chart-of-accounts/entities/chart-of-account.entity';

describe('ChartOfAccounts (e2e)', () => {
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
    // Cleanup
    const coaRepo = moduleFixture.get(getRepositoryToken(ChartOfAccount));
    await coaRepo.delete({ accountCode: 99999 });
    await app.close();
  });

  it('Perform Chart of Accounts CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/api/chart-of-accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        account_code: 99999,
        description: 'E2E Test Account',
        normal_balance: 'debit',
        notes: 'E2E Test Notes'
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    const coaId = createRes.body.id;

    // 2. Read (list)
    const listRes = await request(app.getHttpServer())
      .get('/api/chart-of-accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listRes.body.some((c: any) => c.id === coaId)).toBe(true);

    // 3. Read (one)
    const detailRes = await request(app.getHttpServer())
      .get(`/api/chart-of-accounts/${coaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(detailRes.body.description).toBe('E2E Test Account');

    // 4. Update
    await request(app.getHttpServer())
      .patch(`/api/chart-of-accounts/${coaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        description: 'E2E Test Account Updated'
      })
      .expect(200);

    // 5. Delete
    await request(app.getHttpServer())
      .delete(`/api/chart-of-accounts/${coaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
