import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { Broker } from '../../src/modules/masters/entities/broker.entity';

describe('Brokers (e2e)', () => {
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
    // Cleanup any E2E brokers we created
    const brokerRepo = moduleFixture.get(getRepositoryToken(Broker));
    await brokerRepo.delete({ brokerCode: 'E2E-TEST' });
    await app.close();
  });

  it('Perform Broker CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/api/masters/brokers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        broker_code: 'E2E-TEST',
        name: 'E2E Test Broker',
        contact_name: 'Test Contact',
        contact_email: 'test@example.com',
        is_active: true
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    const brokerId = createRes.body.id;

    // 2. Read (list)
    const listRes = await request(app.getHttpServer())
      .get('/api/masters/brokers')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listRes.body.some((b: any) => b.id === brokerId)).toBe(true);

    // 3. Read (details)
    const detailRes = await request(app.getHttpServer())
      .get(`/api/masters/brokers/${brokerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(detailRes.body.name).toBe('E2E Test Broker');

    // 4. Update
    await request(app.getHttpServer())
      .patch(`/api/masters/brokers/${brokerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Broker Updated'
      })
      .expect(200);

    // Verify updated details
    const updatedRes = await request(app.getHttpServer())
      .get(`/api/masters/brokers/${brokerId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(updatedRes.body.name).toBe('E2E Test Broker Updated');

    // 5. Delete (soft-delete)
    await request(app.getHttpServer())
      .delete(`/api/masters/brokers/${brokerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify that soft-deleted broker is no longer returned in list
    const postDeleteList = await request(app.getHttpServer())
      .get('/api/masters/brokers')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(postDeleteList.body.some((b: any) => b.id === brokerId)).toBe(false);
  });
});
