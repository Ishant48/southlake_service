import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { Product } from '../../src/modules/masters/entities/product.entity';
import { LineOfBusiness } from '../../src/modules/masters/entities/line-of-business.entity';
import { CobMaster } from '../../src/modules/masters/entities/cob-master.entity';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let authToken: string;
  let validLobId: string;
  let validCobId: string;

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

    // Find valid LOB and COB
    const lobRepo = moduleFixture.get(getRepositoryToken(LineOfBusiness));
    const lob = await lobRepo.findOne({ where: {} });
    validLobId = lob!.id;

    const cobRepo = moduleFixture.get(getRepositoryToken(CobMaster));
    const cob = await cobRepo.findOne({ where: {} });
    validCobId = cob!.id;

    // Cleanup existing E2E products to avoid conflicts
    const productRepo = moduleFixture.get(getRepositoryToken(Product));
    await productRepo.delete({ productId: 'E2E-PROD' });
  });

  afterAll(async () => {
    const productRepo = moduleFixture.get(getRepositoryToken(Product));
    await productRepo.delete({ productId: 'E2E-PROD' });
    await app.close();
  });

  it('Perform Product CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/api/masters/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        product_id: 'E2E-PROD',
        lob_id: validLobId,
        cob_id: validCobId,
        name: 'E2E Test Product',
        description: 'Product for E2E tests',
        is_active: true
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    const productId = createRes.body.id;

    // 2. Read (list)
    const listRes = await request(app.getHttpServer())
      .get('/api/masters/products')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(listRes.body.some((p: any) => p.id === productId)).toBe(true);

    // 3. Read (one)
    const detailRes = await request(app.getHttpServer())
      .get(`/api/masters/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(detailRes.body.name).toBe('E2E Test Product');

    // 4. Update
    await request(app.getHttpServer())
      .patch(`/api/masters/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Product Updated'
      })
      .expect(200);

    // 5. Delete (soft-delete)
    await request(app.getHttpServer())
      .delete(`/api/masters/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify deleted
    const postDeleteList = await request(app.getHttpServer())
      .get('/api/masters/products')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(postDeleteList.body.some((p: any) => p.id === productId)).toBe(false);
  });
});
