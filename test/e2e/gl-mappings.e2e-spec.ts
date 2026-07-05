import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { ChartOfAccount } from '../../src/modules/chart-of-accounts/entities/chart-of-account.entity';
import { GlMapping } from '../../src/modules/gl-mappings/entities/gl-mapping.entity';

describe('GlMappings (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let authToken: string;
  let validCoaId: string;

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

    // Get a valid Chart of Account ID
    const coaRepo = moduleFixture.get(getRepositoryToken(ChartOfAccount));
    const coa = await coaRepo.findOne({ where: {} });
    validCoaId = coa!.id;

    // Delete any existing AR mappings to prevent duplicates in E2E tests
    const glMappingRepo = moduleFixture.get(getRepositoryToken(GlMapping));
    await glMappingRepo.delete({ type: 'AR' });
  });

  afterAll(async () => {
    const glMappingRepo = moduleFixture.get(getRepositoryToken(GlMapping));
    await glMappingRepo.delete({ type: 'AR' });
    await app.close();
  });

  it('Perform GL Mapping CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/api/gl-mappings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        coa_id: validCoaId,
        type: 'AR'
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    const mappingId = createRes.body.id;

    // 2. Read (list)
    const listRes = await request(app.getHttpServer())
      .get('/api/gl-mappings')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listRes.body.some((m: any) => m.id === mappingId)).toBe(true);

    // 3. Read (one)
    const detailRes = await request(app.getHttpServer())
      .get(`/api/gl-mappings/${mappingId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(detailRes.body.type).toBe('AR');

    // 4. Update
    await request(app.getHttpServer())
      .patch(`/api/gl-mappings/${mappingId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'AR'
      })
      .expect(200);

    // 5. Delete
    await request(app.getHttpServer())
      .delete(`/api/gl-mappings/${mappingId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
