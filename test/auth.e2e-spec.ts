import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { SnakeCaseInterceptor } from '../src/common/interceptors/snake-case.interceptor';
import { DbHelper } from './helpers/db.helper';
import { AuthHelper } from './helpers/auth.helper';
import { Role } from '../src/modules/roles/entities/role.entity';
import { User } from '../src/modules/users/entities/user.entity';

// ─── Test data ────────────────────────────────────────────────────────────────
// Use distinct email domains per test suite to avoid cross-suite conflicts
const AUTH_DOMAIN = '@test.auth.e2e.com';

const testUsers = {
  active: {
    email: `active-user${AUTH_DOMAIN}`,
    password: 'Auth@Test1234',
    name: 'Active Auth User',
  },
  inactive: {
    email: `inactive-user${AUTH_DOMAIN}`,
    password: 'Auth@Test1234',
    name: 'Inactive Auth User',
  },
};

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let db: DbHelper;
  let auth: AuthHelper;
  let testRole: Role;
  let activeUser: User;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new SnakeCaseInterceptor());
    await app.init();

    const dataSource = module.get(DataSource);
    db = new DbHelper(dataSource);
    auth = new AuthHelper(app, db);

    // Seed test role and users
    testRole = await db.createRole({ name: `auth-test-role${AUTH_DOMAIN}`, label: 'Auth Test' });

    const created = await db.createUser(testRole.id, {
      email: testUsers.active.email,
      name: testUsers.active.name,
      password: testUsers.active.password,
    });
    activeUser = created;

    await db.createUser(testRole.id, {
      email: testUsers.inactive.email,
      name: testUsers.inactive.name,
      password: testUsers.inactive.password,
      status: 'inactive',
    });
  });

  afterAll(async () => {
    const allEmails = Object.values(testUsers).map(u => u.email);
    await db.cleanAll(allEmails, [`auth-test-role${AUTH_DOMAIN}`]);
    await app.close();
  });

  // ─── POST /api/auth/login ─────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'pass' })
        .expect(400);
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUsers.active.email })
        .expect(400);
    });

    it('should return 401 when user does not exist', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@noemail.com', password: 'pass' })
        .expect(401);
    });

    it('should return 401 when password is wrong', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUsers.active.email, password: 'WrongPassword!' })
        .expect(401);
    });

    it('should return 401 when user is inactive', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUsers.inactive.email, password: testUsers.inactive.password })
        .expect(401);
    });

    it('should return 200 and send OTP for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUsers.active.email, password: testUsers.active.password })
        .expect(200);

      expect(res.body.message).toContain('OTP');
    });
  });

  // ─── POST /api/auth/verify-otp ────────────────────────────────────────────
  describe('POST /api/auth/verify-otp', () => {
    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ otp: '123456' })
        .expect(400);
    });

    it('should return 401 when OTP is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ email: testUsers.active.email, otp: '000000' })
        .expect(401);
    });

    it('should return session token on valid OTP', async () => {
      const { sessionToken } = await auth.loginWithCredentials(
        testUsers.active.email,
        testUsers.active.password,
      );

      expect(sessionToken).toBeDefined();
      expect(typeof sessionToken).toBe('string');
      expect(sessionToken.length).toBeGreaterThan(10);

      // Clean up session
      await db.cleanSessionsForUser(activeUser.id);
    });
  });

  // ─── GET /api/auth/me ─────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return 401 without a token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });

    it('should return current user with valid session token', async () => {
      const { sessionToken } = await auth.loginWithCredentials(
        testUsers.active.email,
        testUsers.active.password,
      );

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${sessionToken}`)
        .expect(200);

      expect(res.body.email).toBe(testUsers.active.email);
      expect(res.body.name).toBe(testUsers.active.name);

      // Clean up
      await db.cleanSessionsForUser(activeUser.id);
    });
  });

  // ─── POST /api/auth/logout ────────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });

    it('should successfully logout and invalidate the session', async () => {
      const { sessionToken } = await auth.loginWithCredentials(
        testUsers.active.email,
        testUsers.active.password,
      );

      // Logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${sessionToken}`)
        .expect(200);

      // Token should now be invalid
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${sessionToken}`)
        .expect(401);
    });
  });
});
