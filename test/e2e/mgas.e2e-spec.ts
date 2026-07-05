import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { MgaMaster } from '../../src/modules/masters/entities/mga-master.entity';

describe('Mgas (e2e)', () => {
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

    // Cleanup E2E MGAs
    const mgaRepo = moduleFixture.get(getRepositoryToken(MgaMaster));
    await mgaRepo.delete({ mgaCode: 'E2E-TEST' });
  });

  afterAll(async () => {
    const mgaRepo = moduleFixture.get(getRepositoryToken(MgaMaster));
    await mgaRepo.delete({ mgaCode: 'E2E-TEST' });
    await app.close();
  });

  it('Perform MGA CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/api/masters/mgas')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        mga_code: 'E2E-TEST',
        name: 'E2E Test MGA',
        is_active: true,
        address: 'E2E Test Address'
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    const mgaId = createRes.body.id;

    // 2. Read (list)
    const listRes = await request(app.getHttpServer())
      .get('/api/masters/mgas')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listRes.body.some((m: any) => m.id === mgaId)).toBe(true);

    // 3. Read (one)
    const detailRes = await request(app.getHttpServer())
      .get(`/api/masters/mgas/${mgaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(detailRes.body.name).toBe('E2E Test MGA');

    // 4. Update
    await request(app.getHttpServer())
      .patch(`/api/masters/mgas/${mgaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test MGA Updated'
      })
      .expect(200);

    // 5. Delete (soft-delete)
    await request(app.getHttpServer())
      .delete(`/api/masters/mgas/${mgaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify deleted
    const postDeleteList = await request(app.getHttpServer())
      .get('/api/masters/mgas')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(postDeleteList.body.some((m: any) => m.id === mgaId)).toBe(false);
  });
});
