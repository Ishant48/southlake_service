import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';

describe('FinancialReports (e2e)', () => {
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
    await app.close();
  });

  it('GET /api/financial-reports/balance-sheet - returns balance sheet report', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/financial-reports/balance-sheet')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ period: 'June 2026' })
      .expect(200);

    expect(res.body.assets).toBeDefined();
    expect(res.body.liabilities).toBeDefined();
    expect(res.body.equity).toBeDefined();
  });

  it('GET /api/financial-reports/pl - returns profit and loss report', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/financial-reports/pl')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ period: 'June 2026' })
      .expect(200);

    expect(res.body.revenues).toBeDefined();
    expect(res.body.expenses).toBeDefined();
    expect(res.body.netIncome).toBeDefined();
  });
});
