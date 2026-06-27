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
const USERS_DOMAIN = '@test.users.e2e.com';

const testCredentials = {
  admin: { email: `admin${USERS_DOMAIN}`, password: 'Users@Test1234', name: 'Test Admin User' },
  target: { email: `target${USERS_DOMAIN}`, password: 'Users@Test1234', name: 'Target User' },
};

describe('Users (e2e)', () => {
  let app: INestApplication;
  let db: DbHelper;
  let auth: AuthHelper;
  let testRole: Role;
  let targetUser: User;
  let adminToken: string;

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

    testRole = await db.createRole({ name: `users-test-role${USERS_DOMAIN}`, label: 'Users Test' });

    await db.createUser(testRole.id, {
      email: testCredentials.admin.email,
      name: testCredentials.admin.name,
      password: testCredentials.admin.password,
    });

    targetUser = await db.createUser(testRole.id, {
      email: testCredentials.target.email,
      name: testCredentials.target.name,
      password: testCredentials.target.password,
    });

    const { sessionToken } = await auth.loginWithCredentials(
      testCredentials.admin.email,
      testCredentials.admin.password,
    );
    adminToken = sessionToken;
  });

  afterAll(async () => {
    const allEmails = Object.values(testCredentials).map(u => u.email);
    await db.cleanAll(allEmails, [`users-test-role${USERS_DOMAIN}`]);
    await app.close();
  });

  // ─── GET /api/users ───────────────────────────────────────────────────────
  describe('GET /api/users', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('should return paginated user list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(2);
      expect(res.body.page).toBe(1);
      expect(res.body.per_page).toBeDefined();
      expect(res.body.total_pages).toBeDefined();
    });

    it('should filter by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .query({ search: testCredentials.target.name })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toContain('Target');
    });

    it('should respect pagination parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .query({ page: 1, per_page: 1 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.per_page).toBe(1);
    });
  });

  // ─── GET /api/users/stats ─────────────────────────────────────────────────
  describe('GET /api/users/stats', () => {
    it('should return user statistics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.total).toBeGreaterThanOrEqual(2);
      expect(res.body).toHaveProperty('active');
    });
  });

  // ─── GET /api/users/:id ───────────────────────────────────────────────────
  describe('GET /api/users/:id', () => {
    it('should return user details by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(targetUser.id);
      expect(res.body.email).toBe(testCredentials.target.email);
      expect(res.body.name).toBe(testCredentials.target.name);
    });

    it('should return 404 for non-existent user', async () => {
      return request(app.getHttpServer())
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── PATCH /api/users/:id ─────────────────────────────────────────────────
  describe('PATCH /api/users/:id', () => {
    it('should update user name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Target User' })
        .expect(200);

      expect(res.body.name).toBe('Updated Target User');
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .patch('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nope' })
        .expect(404);
    });
  });

  // ─── PATCH /api/users/:id/status ─────────────────────────────────────────
  describe('PATCH /api/users/:id/status', () => {
    it('should deactivate a user', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${targetUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' })
        .expect(200);

      expect(res.body.status).toBe('inactive');
    });

    it('should reactivate a user', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${targetUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' })
        .expect(200);

      expect(res.body.status).toBe('active');
    });

    it('should return 400 with invalid status value', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${targetUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'unknown-status' })
        .expect(400);
    });
  });

  // ─── POST /api/users/invite ───────────────────────────────────────────────
  describe('POST /api/users/invite', () => {
    const inviteEmail = `invite-test${USERS_DOMAIN}`;

    afterEach(async () => {
      await db.cleanOtpsForEmail(inviteEmail);
    });

    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/api/users/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'No Email', role_id: testRole.id, user_type: 'staff' })
        .expect(400);
    });

    it('should return 400 when role_id is missing', () => {
      return request(app.getHttpServer())
        .post('/api/users/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: inviteEmail, name: 'No Role', user_type: 'staff' })
        .expect(400);
    });

    it('should send invite and return success message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: inviteEmail,
          name: 'Invite Test User',
          role_id: testRole.id,
          user_type: 'staff',
        })
        .expect(201);

      expect(res.body.message).toContain(inviteEmail);

      // Cleanup invite
      await db.revokeInviteByEmail(inviteEmail);
    });

    it('should return 400 when inviting an already-registered user', () => {
      return request(app.getHttpServer())
        .post('/api/users/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: testCredentials.target.email,
          name: 'Duplicate',
          role_id: testRole.id,
          user_type: 'staff',
        })
        .expect(400);
    });
  });

  // ─── DELETE /api/users/:id ────────────────────────────────────────────────
  describe('DELETE /api/users/:id', () => {
    it('should soft delete a user', async () => {
      const throwaway = await db.createUser(testRole.id, {
        email: `throwaway${USERS_DOMAIN}`,
        name: 'Throwaway User',
        password: 'Delete@Test1234',
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/users/${throwaway.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe('User deleted');

      // Verify user is not returned in list anymore
      const listRes = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = listRes.body.data.find((u: any) => u.id === throwaway.id);
      expect(found).toBeUndefined();

      await db.cleanAll([`throwaway${USERS_DOMAIN}`]);
    });
  });
});
