import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { PendingInvite } from '../../src/modules/users/entities/pending-invite.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { SnakeCaseInterceptor } from '../../src/common/interceptors/snake-case.interceptor';
import { hashToken } from '../../src/common/utils/hash-token.util';

describe('Password reset flow (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let sentOtp: string;
  let mailOtpSpy: jest.SpyInstance;
  let mailResetSpy: jest.SpyInstance;

  const testUserEmail = `e2e-password-reset-${Date.now()}@example.com`;

  async function loginAndGetToken(email: string, password: string): Promise<string> {
    sentOtp = '';
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const verifyRes = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ email, otp: sentOtp, device_label: 'E2E Test' })
      .expect(200);

    return verifyRes.body.session_token;
  }

  function extractTokenFromLink(link: string): string {
    const url = new URL(link);
    const token = url.searchParams.get('token');
    if (!token) throw new Error(`No token query param found in reset link: ${link}`);
    return token;
  }

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    // Mirror main.ts's bootstrap so this test observes the real wire shape
    // (snake_case) the frontend actually receives, not the raw camelCase
    // entity shape createNestApplication() would otherwise skip straight to.
    app.useGlobalInterceptors(new SnakeCaseInterceptor());
    await app.init();

    const sessionRepo = moduleFixture.get(getRepositoryToken(UserSession));
    await sessionRepo.manager.query('DELETE FROM "login_challenges"');
    await sessionRepo.createQueryBuilder().delete().execute();

    const otpRepo = moduleFixture.get(getRepositoryToken(LoginOtp));
    await otpRepo.createQueryBuilder().delete().execute();

    const mailService = moduleFixture.get(MailService);
    mailOtpSpy = jest.spyOn(mailService, 'sendOtp').mockImplementation(async (_email, otp) => {
      sentOtp = otp;
    });
    mailResetSpy = jest.spyOn(mailService, 'sendPasswordReset').mockResolvedValue(undefined);

    // Create a disposable test user via the normal invite + accept-invite
    // flow, reusing the admin account's role so no extra role fixture is
    // needed and nothing here touches the shared admin@southlake.com account.
    const superadminToken = await loginAndGetToken('admin@southlake.com', 'Admin@123');

    const userRepo = moduleFixture.get(getRepositoryToken(User));
    const admin = await userRepo.findOne({ where: { email: 'admin@southlake.com' } });
    if (!admin) throw new Error('Expected admin@southlake.com to exist');

    await request(app.getHttpServer())
      .post('/api/users/invite')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({
        email: testUserEmail,
        name: 'E2E Password Reset User',
        role_id: admin.roleId,
        user_type: 'staff',
      })
      .expect(201);

    const inviteRepo = moduleFixture.get(getRepositoryToken(PendingInvite));
    const invite = await inviteRepo.findOne({ where: { email: testUserEmail } });
    if (!invite) throw new Error('Expected a pending invite to have been created');

    const acceptRes = await request(app.getHttpServer())
      .post('/api/auth/accept-invite')
      .send({ token: invite.token, password: 'OriginalPass@123' })
      .expect(200);

    // Accepting an invite already logs the user in with a session. Log that
    // out so it doesn't interfere with the "old session gets revoked" check,
    // which needs a session created independently of this setup step.
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${acceptRes.body.session_token}`)
      .expect(200);
  });

  afterAll(async () => {
    const userRepo = moduleFixture.get(getRepositoryToken(User));
    const createdUser = await userRepo.findOne({ where: { email: testUserEmail } });

    if (createdUser) {
      // Rows referencing the test user via a NO ACTION FK must go first.
      await userRepo.manager.query('DELETE FROM "activity_logs" WHERE "user_id" = $1', [
        createdUser.id,
      ]);
      await userRepo.manager.query('DELETE FROM "password_reset_tokens" WHERE "user_id" = $1', [
        createdUser.id,
      ]);
      await userRepo.manager.query('DELETE FROM "login_challenges" WHERE "user_id" = $1', [
        createdUser.id,
      ]);
      await userRepo.manager.query('DELETE FROM "user_sessions" WHERE "user_id" = $1', [
        createdUser.id,
      ]);
      await userRepo.manager.query('DELETE FROM "user_permissions" WHERE "user_id" = $1', [
        createdUser.id,
      ]);
      await userRepo.delete({ id: createdUser.id });
    }

    const inviteRepo = moduleFixture.get(getRepositoryToken(PendingInvite));
    await inviteRepo.delete({ email: testUserEmail });

    mailOtpSpy.mockRestore();
    mailResetSpy.mockRestore();
    await app.close();
  });

  it('requests a reset, validates the token, resets the password, and revokes existing sessions', async () => {
    // 1. Establish a session with the ORIGINAL password before requesting a
    // reset, so we can assert it gets revoked once the reset completes.
    const preResetToken = await loginAndGetToken(testUserEmail, 'OriginalPass@123');
    const sessionRepo = moduleFixture.get(getRepositoryToken(UserSession));

    // 2. Request a password reset and capture the token from the mailed link.
    mailResetSpy.mockClear();
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: testUserEmail })
      .expect(200);

    expect(mailResetSpy).toHaveBeenCalledTimes(1);
    const [, resetLink] = mailResetSpy.mock.calls[0] as [string, string];
    const resetToken = extractTokenFromLink(resetLink);

    // 3. Validate the token.
    await request(app.getHttpServer())
      .get('/api/auth/reset-password/validate')
      .query({ token: resetToken })
      .expect(200, { valid: true });

    // 4. Reset the password.
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'BrandNewPass@123' })
      .expect(200);

    // 5. Old password now fails.
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUserEmail, password: 'OriginalPass@123' })
      .expect(401);

    // 6. New password succeeds through the full login+OTP flow.
    const newToken = await loginAndGetToken(testUserEmail, 'BrandNewPass@123');
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200);

    // 7. The pre-reset session is now revoked.
    const preResetSession = await sessionRepo.findOne({
      where: { sessionToken: hashToken(preResetToken) },
    });
    expect(preResetSession).toBeDefined();
    expect(preResetSession?.isActive).toBe(false);
    expect(preResetSession?.revokeReason).toBe('password_reset');

    // 8. Reusing the already-used reset token fails with 404.
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'AnotherPass@123' })
      .expect(404);
  });

  it('returns a generic 200 response for a nonexistent email without throwing', async () => {
    mailResetSpy.mockClear();
    const res = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'definitely-not-a-real-user@example.com' })
      .expect(200);

    expect(res.body.message).toBeDefined();
    expect(mailResetSpy).not.toHaveBeenCalled();
  });
});
