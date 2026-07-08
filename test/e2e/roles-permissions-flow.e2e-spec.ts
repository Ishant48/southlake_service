import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/mail.service';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { PendingInvite } from '../../src/modules/users/entities/pending-invite.entity';
import { Role } from '../../src/modules/roles/entities/role.entity';
import { RolePermission } from '../../src/modules/roles/entities/role-permission.entity';
import { User } from '../../src/modules/users/entities/user.entity';

describe('Roles & Permissions flow (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let superadminToken: string;
  let sentOtp: string;
  let mailSpy: jest.SpyInstance;

  const testRoleLabel = `E2E Test Role ${Date.now()}`;
  const testUserEmail = `e2e-role-flow-${Date.now()}@example.com`;
  let createdRoleId: string;

  async function loginAndGetToken(email: string, password: string): Promise<string> {
    sentOtp = '';
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const verifyRes = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ email, otp: sentOtp, device_label: 'E2E Test' })
      .expect(200);

    return verifyRes.body.session_token;
  }

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    const sessionRepo = moduleFixture.get(getRepositoryToken(UserSession));
    await sessionRepo.manager.query('DELETE FROM "login_challenges"');
    await sessionRepo.createQueryBuilder().delete().execute();

    const otpRepo = moduleFixture.get(getRepositoryToken(LoginOtp));
    await otpRepo.createQueryBuilder().delete().execute();

    const mailService = moduleFixture.get(MailService);
    mailSpy = jest.spyOn(mailService, 'sendOtp').mockImplementation(async (_email, otp) => {
      sentOtp = otp;
    });

    superadminToken = await loginAndGetToken('admin@southlake.com', 'Admin@123');
  });

  afterAll(async () => {
    const userRepo = moduleFixture.get(getRepositoryToken(User));
    const createdUser = await userRepo.findOne({ where: { email: testUserEmail } });

    if (createdUser) {
      // Rows referencing the test user via a NO ACTION FK must go first.
      await userRepo.manager.query('DELETE FROM "activity_logs" WHERE "user_id" = $1', [
        createdUser.id,
      ]);
      await userRepo.manager.query('DELETE FROM "login_challenges" WHERE "user_id" = $1', [
        createdUser.id,
      ]);
      await userRepo.manager.query('DELETE FROM "user_sessions" WHERE "user_id" = $1', [
        createdUser.id,
      ]);
      await userRepo.manager.query('DELETE FROM "user_permissions" WHERE "user_id" = $1', [
        createdUser.id,
      ]);
      await userRepo.delete({ id: createdUser.id });
    }

    const inviteRepo = moduleFixture.get(getRepositoryToken(PendingInvite));
    await inviteRepo.delete({ email: testUserEmail });

    if (createdRoleId) {
      const rolePermRepo = moduleFixture.get(getRepositoryToken(RolePermission));
      await rolePermRepo.delete({ roleId: createdRoleId });
      await userRepo.manager.query('DELETE FROM "activity_logs" WHERE "entity_id" = $1', [
        createdRoleId,
      ]);
      const roleRepo = moduleFixture.get(getRepositoryToken(Role));
      await roleRepo.delete({ id: createdRoleId });
    }

    mailSpy.mockRestore();
    await app.close();
  });

  it('creates a role with a server-generated slug, assigns a permission subset, invites and verifies a user against it', async () => {
    // 1. List permissions and pick a small, deterministic subset (all
    // 'broker' actions - a plain CRUD module with no extra actions).
    const allPermsRes = await request(app.getHttpServer())
      .get('/api/permissions')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);

    const brokerPerms = (allPermsRes.body as { id: string; action: string }[])
      .filter(p => p.action.startsWith('broker.'))
      .sort((a, b) => a.action.localeCompare(b.action))
      .slice(0, 3);

    expect(brokerPerms.length).toBe(3);
    const assignedActions = brokerPerms.map(p => p.action).sort();

    // 2. Create a role sending only `label` - name must be server-generated.
    const createRoleRes = await request(app.getHttpServer())
      .post('/api/roles')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ label: testRoleLabel, name: 'client-supplied-should-be-ignored' })
      .expect(201);

    createdRoleId = createRoleRes.body.id;
    expect(createRoleRes.body.name).toBeDefined();
    expect(createRoleRes.body.name).not.toBe('client-supplied-should-be-ignored');
    expect(createRoleRes.body.name).toMatch(/^[a-z0-9_]+$/);

    // 3. Assign exactly the chosen 3-permission subset to the role.
    await request(app.getHttpServer())
      .put(`/api/roles/${createdRoleId}/permissions`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(
        brokerPerms.map(p => ({
          moduleId: 'broker',
          permissionId: p.id,
        })),
      )
      .expect(200);

    // 4. Invite a user with that role.
    await request(app.getHttpServer())
      .post('/api/users/invite')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({
        email: testUserEmail,
        name: 'E2E Role Flow User',
        role_id: createdRoleId,
        user_type: 'staff',
      })
      .expect(201);

    // 5. Retrieve the invite token directly from the DB (no mail inbox in tests).
    const inviteRepo = moduleFixture.get(getRepositoryToken(PendingInvite));
    const invite = await inviteRepo.findOne({ where: { email: testUserEmail } });
    if (!invite) throw new Error('Expected a pending invite to have been created');

    // 6. Accept the invite.
    const acceptRes = await request(app.getHttpServer())
      .post('/api/auth/accept-invite')
      .send({ token: invite.token, password: 'NewUserPass@123' })
      .expect(200);

    const acceptPermissions = (acceptRes.body.user.permissions as { id: string; action: string }[])
      .map(p => p.action)
      .sort();
    expect(acceptPermissions).toEqual(assignedActions);

    // Accepting an invite already logs the user in with a session. Log that
    // out first so the subsequent login doesn't hit a session-conflict
    // challenge instead of issuing a fresh session token.
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${acceptRes.body.session_token}`)
      .expect(200);

    // 7. Full login -> OTP verify flow for the new user.
    const newUserToken = await loginAndGetToken(testUserEmail, 'NewUserPass@123');

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newUserToken}`)
      .expect(200);

    const mePermissions = (meRes.body.permissions as { id: string; action: string }[])
      .map(p => p.action)
      .sort();
    expect(mePermissions).toEqual(assignedActions);

    // 8. GET /roles never contains a role named 'admin'.
    const rolesRes = await request(app.getHttpServer())
      .get('/api/roles')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);

    const roleNames = (rolesRes.body.data as { name: string }[]).map(r => r.name);
    expect(roleNames).not.toContain('admin');
  });
});
