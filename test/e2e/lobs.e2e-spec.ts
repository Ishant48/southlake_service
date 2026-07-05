import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { LineOfBusiness } from '../../src/modules/masters/entities/line-of-business.entity';

describe('Lobs (e2e)', () => {
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
  });

  afterAll(async () => {
    // Cleanup any E2E LOBs we created
    const lobRepo = moduleFixture.get(getRepositoryToken(LineOfBusiness));
    await lobRepo.delete({ lobCode: 'E2E-TEST' });
    await app.close();
  });

  it('Perform LOB CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/api/masters/lobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        lob_code: 'E2E-TEST',
        name: 'E2E Test LOB',
        is_active: true,
        description: 'E2E Test Description'
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    const lobId = createRes.body.id;

    // 2. Read (list)
    const listRes = await request(app.getHttpServer())
      .get('/api/masters/lobs')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listRes.body.some((l: any) => l.id === lobId)).toBe(true);

    // 3. Update
    await request(app.getHttpServer())
      .patch(`/api/masters/lobs/${lobId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test LOB Updated'
      })
      .expect(200);

    // 4. Delete (soft-delete)
    await request(app.getHttpServer())
      .delete(`/api/masters/lobs/${lobId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify soft-deleted item is no longer returned in list
    const postDeleteList = await request(app.getHttpServer())
      .get('/api/masters/lobs')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(postDeleteList.body.some((l: any) => l.id === lobId)).toBe(false);
  });
});
