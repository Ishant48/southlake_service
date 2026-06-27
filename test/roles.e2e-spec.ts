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
// ─── Test data ────────────────────────────────────────────────────────────────
const ROLES_DOMAIN = '@test.roles.e2e.com';

const testCredentials = {
  admin: { email: `admin${ROLES_DOMAIN}`, password: 'Roles@Test1234', name: 'Roles Admin User' },
};

describe('Roles (e2e)', () => {
  let app: INestApplication;
  let db: DbHelper;
  let auth: AuthHelper;
  let testRole: Role;
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

    testRole = await db.createRole({ name: `roles-test-role${ROLES_DOMAIN}`, label: 'Roles Test' });

    await db.createUser(testRole.id, {
      email: testCredentials.admin.email,
      name: testCredentials.admin.name,
      password: testCredentials.admin.password,
    });

    const { sessionToken } = await auth.loginWithCredentials(
      testCredentials.admin.email,
      testCredentials.admin.password,
    );
    adminToken = sessionToken;
  });

  afterAll(async () => {
    await db.cleanAll([testCredentials.admin.email], [`roles-test-role${ROLES_DOMAIN}`]);
    await app.close();
  });

  // ─── GET /api/roles ───────────────────────────────────────────────────────
  describe('GET /api/roles', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/api/roles').expect(401);
    });

    it('should return paginated list of roles', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.page).toBe(1);
    });

    it('should include user_count for each role', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const testRoleEntry = res.body.data.find((r: any) => r.id === testRole.id);
      expect(testRoleEntry).toBeDefined();
      expect(testRoleEntry.user_count).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── GET /api/roles/:id ───────────────────────────────────────────────────
  describe('GET /api/roles/:id', () => {
    it('should return role details with permissions array', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(testRole.id);
      expect(res.body.name).toBe(testRole.name);
      expect(res.body).toHaveProperty('user_count');
      expect(res.body).toHaveProperty('permissions');
      expect(Array.isArray(res.body.permissions)).toBe(true);
    });

    it('should return 404 for non-existent role', () => {
      return request(app.getHttpServer())
        .get('/api/roles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── POST /api/roles ──────────────────────────────────────────────────────
  describe('POST /api/roles', () => {
    const newRoleName = `e2e-created-role${ROLES_DOMAIN}`;
    let createdRoleId: string;

    afterAll(async () => {
      if (createdRoleId) {
        await db.deleteRoleByName(newRoleName);
      }
    });

    it('should return 400 when name is missing', () => {
      return request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'Missing Name' })
        .expect(400);
    });

    it('should return 400 when label is missing', () => {
      return request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'missing-label' })
        .expect(400);
    });

    it('should create a new role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: newRoleName, label: 'E2E Created Role', color: '#123456' })
        .expect(201);

      expect(res.body.name).toBe(newRoleName);
      expect(res.body.label).toBe('E2E Created Role');
      expect(res.body.user_count).toBe(0);
      createdRoleId = res.body.id;
    });

    it('should return 400 when role name already exists', async () => {
      return request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: newRoleName, label: 'Duplicate Role' })
        .expect(400);
    });
  });

  // ─── PATCH /api/roles/:id ─────────────────────────────────────────────────
  describe('PATCH /api/roles/:id', () => {
    let editableRole: Role;

    beforeAll(async () => {
      editableRole = await db.createRole({
        name: `editable-role${ROLES_DOMAIN}`,
        label: 'Editable Role',
      });
    });

    afterAll(async () => {
      await db.deleteRoleByName(`editable-role${ROLES_DOMAIN}`);
    });

    it('should update role label and color', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/roles/${editableRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'Updated Label', color: '#ABCDEF' })
        .expect(200);

      expect(res.body.label).toBe('Updated Label');
      expect(res.body.color).toBe('#ABCDEF');
    });

    it('should return 404 for non-existent role', () => {
      return request(app.getHttpServer())
        .patch('/api/roles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'Nope' })
        .expect(404);
    });
  });

  // ─── DELETE /api/roles/:id ────────────────────────────────────────────────
  describe('DELETE /api/roles/:id', () => {
    it('should return 400 when users are assigned to the role', async () => {
      // testRole has adminUser assigned
      return request(app.getHttpServer())
        .delete(`/api/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should delete a role with no assigned users', async () => {
      const emptyRole = await db.createRole({
        name: `empty-role${ROLES_DOMAIN}`,
        label: 'Empty Role',
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/roles/${emptyRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe('Role deleted');

      // Verify gone
      await request(app.getHttpServer())
        .get(`/api/roles/${emptyRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent role', () => {
      return request(app.getHttpServer())
        .delete('/api/roles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── PUT /api/roles/:id/permissions ──────────────────────────────────────
  describe('PUT /api/roles/:id/permissions', () => {
    it('should return 404 when role does not exist', () => {
      return request(app.getHttpServer())
        .put('/api/roles/00000000-0000-0000-0000-000000000000/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send([])
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/roles/${testRole.id}/permissions`)
        .send([])
        .expect(401);
    });
  });
});
