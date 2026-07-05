import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { ReinsurerCompany } from '../../src/modules/masters/entities/reinsurer-company.entity';

describe('Reinsurers (e2e)', () => {
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

    // Cleanup E2E reinsurers
    const reinsurerRepo = moduleFixture.get(getRepositoryToken(ReinsurerCompany));
    await reinsurerRepo.delete({ reinsurerCompanyId: 'E2E-REIN' });
  });

  afterAll(async () => {
    const reinsurerRepo = moduleFixture.get(getRepositoryToken(ReinsurerCompany));
    await reinsurerRepo.delete({ reinsurerCompanyId: 'E2E-REIN' });
    await app.close();
  });

  it('Perform Reinsurer CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/api/masters/reinsurers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reinsurer_company_id: 'E2E-REIN',
        name: 'E2E Test Reinsurer',
        is_active: true
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    const reinsurerId = createRes.body.id;

    // 2. Read (list)
    const listRes = await request(app.getHttpServer())
      .get('/api/masters/reinsurers')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listRes.body.some((r: any) => r.id === reinsurerId)).toBe(true);

    // 3. Update
    await request(app.getHttpServer())
      .patch(`/api/masters/reinsurers/${reinsurerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Reinsurer Updated'
      })
      .expect(200);

    // 4. Delete (soft-delete)
    await request(app.getHttpServer())
      .delete(`/api/masters/reinsurers/${reinsurerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify deleted
    const postDeleteList = await request(app.getHttpServer())
      .get('/api/masters/reinsurers')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(postDeleteList.body.some((r: any) => r.id === reinsurerId)).toBe(false);
  });
});
