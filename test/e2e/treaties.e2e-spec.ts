import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { Treaty } from '../../src/modules/masters/entities/treaty.entity';

describe('Treaties (e2e)', () => {
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

    // Cleanup E2E treaties
    const treatyRepo = moduleFixture.get(getRepositoryToken(Treaty));
    await treatyRepo.delete({ treatyCode: 'E2E-TREATY' });
  });

  afterAll(async () => {
    const treatyRepo = moduleFixture.get(getRepositoryToken(Treaty));
    await treatyRepo.delete({ treatyCode: 'E2E-TREATY' });
    await app.close();
  });

  it('Perform Treaty CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/api/masters/treaties')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        treaty_code: 'E2E-TREATY',
        name: 'E2E Test Treaty',
        treaty_type: 'Quota Share',
        is_active: true
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    const treatyId = createRes.body.id;

    // 2. Read (list)
    const listRes = await request(app.getHttpServer())
      .get('/api/masters/treaties')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listRes.body.some((t: any) => t.id === treatyId)).toBe(true);

    // 3. Read (one)
    const detailRes = await request(app.getHttpServer())
      .get(`/api/masters/treaties/${treatyId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(detailRes.body.name).toBe('E2E Test Treaty');

    // 4. Update
    await request(app.getHttpServer())
      .patch(`/api/masters/treaties/${treatyId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Treaty Updated'
      })
      .expect(200);

    // 5. Delete
    await request(app.getHttpServer())
      .delete(`/api/masters/treaties/${treatyId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
