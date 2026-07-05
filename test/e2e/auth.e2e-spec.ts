import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(async () => {
    // Clear active sessions to prevent session conflicts
    const sessionRepo = moduleFixture.get(getRepositoryToken(UserSession));
    await sessionRepo.createQueryBuilder().delete().execute();

    const otpRepo = moduleFixture.get(getRepositoryToken(LoginOtp));
    await otpRepo.createQueryBuilder().delete().execute();
  });

  it('Perform full Login, fetch Profile, and Logout', async () => {
    const mailService = moduleFixture.get(MailService);
    let sentOtp = '';
    const spy = jest.spyOn(mailService, 'sendOtp').mockImplementation(async (email, otp) => {
      sentOtp = otp;
    });

    // 1. Request OTP
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@southlake.com', password: 'Admin@123' })
      .expect(200);

    expect(sentOtp).not.toBe('');

    // 2. Verify OTP
    const verifyRes = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ email: 'admin@southlake.com', otp: sentOtp, device_label: 'E2E Test' })
      .expect(200);

    expect(verifyRes.body.token_type).toBe('session');
    expect(verifyRes.body.session_token).toBeDefined();
    const token = verifyRes.body.session_token;

    // 3. Get profile (authorized request)
    const profileRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profileRes.body.email).toBe('admin@southlake.com');

    // 4. Logout
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // 5. Verify token is revoked
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    spy.mockRestore();
  });

  afterAll(async () => {
    await app.close();
  });
});
