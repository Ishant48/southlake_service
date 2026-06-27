import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { DbHelper } from './db.helper';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';

export interface LoginResult {
  sessionToken: string;
  userId: string;
}

export class AuthHelper {
  constructor(
    private readonly app: INestApplication,
    private readonly db: DbHelper,
  ) {}

  /**
   * Completes the full login flow for a test user.
   * Reads the OTP hash from DB, then verifies with a known plaintext OTP.
   */
  async loginWithCredentials(email: string, password: string): Promise<LoginResult> {
    // Step 1: trigger OTP send
    await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    // Step 2: get the raw OTP by inserting a known one directly
    const knownOtp = '999999';
    const knownHash = await bcrypt.hash(knownOtp, 10);
    const otpRepo = this.db.get(LoginOtp);
    const latestOtp = await this.db.getLatestOtpRecord(email);

    if (!latestOtp) throw new Error(`No OTP record found for ${email}`);

    // Overwrite the hash with a known value we can use
    latestOtp.otpHash = knownHash;
    await otpRepo.save(latestOtp);

    // Step 3: verify OTP
    const res = await request(this.app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ email, otp: knownOtp, device_label: 'Test Device' })
      .expect(200);

    const token = res.body.session_token as string;
    const userId = res.body.user?.id as string;

    if (!token) throw new Error('No session_token in verify-otp response');

    return { sessionToken: token, userId };
  }

  /**
   * Returns a supertest agent with Bearer token set.
   */
  bearer(token: string) {
    return request(this.app.getHttpServer()).set('Authorization', `Bearer ${token}`);
  }
}
