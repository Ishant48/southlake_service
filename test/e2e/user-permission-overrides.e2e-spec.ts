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
import { UserPermission } from '../../src/modules/users/entities/user-permission.entity';

describe('User permission overrides (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let superadminToken: string;
  let sentOtp: string;
  let mailSpy: jest.SpyInstance;

  const suffix = Date.now();
  const testRoleLabel = `E2E Override Role ${suffix}`;
  const u1Email = `e2e-override-u1-${suffix}@example.com`;
  const u2Email = `e2e-override-u2-${suffix}@example.com`;
  let createdRoleId: string;
  let u1Id: string;
  let u2Id: string;

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

  async function acceptInvite(email: string, name: string, roleId: string): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/users/invite')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ email, name, role_id: roleId, user_type: 'staff' })
      .expect(201);

    const inviteRepo = moduleFixture.get(getRepositoryToken(PendingInvite));
    const invite = await inviteRepo.findOne({ where: { email } });
    if (!invite) throw new Error(`Expected a pending invite for ${email}`);

    const acceptRes = await request(app.getHttpServer())
      .post('/api/auth/accept-invite')
      .send({ token: invite.token, password: 'NewUserPass@123' })
      .expect(200);

    // Accepting an invite already logs the user in with a session. Log that
    // out so a later login for this same user doesn't hit a session-conflict
    // challenge instead of issuing a fresh session token.
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${acceptRes.body.session_token}`)
      .expect(200);

    return acceptRes.body.user.id;
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

    for (const id of [u1Id, u2Id].filter(Boolean)) {
      // Rows referencing the test user via a NO ACTION FK must go first.
      await userRepo.manager.query('DELETE FROM "activity_logs" WHERE "user_id" = $1', [id]);
      await userRepo.manager.query('DELETE FROM "login_challenges" WHERE "user_id" = $1', [id]);
      await userRepo.manager.query('DELETE FROM "user_sessions" WHERE "user_id" = $1', [id]);
      await userRepo.manager.query('DELETE FROM "user_permissions" WHERE "user_id" = $1', [id]);
      await userRepo.delete({ id });
    }

    const inviteRepo = moduleFixture.get(getRepositoryToken(PendingInvite));
    await inviteRepo.delete({ email: u1Email });
    await inviteRepo.delete({ email: u2Email });

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

  it('scopes a permission revoke to a single user without leaking to others sharing the role', async () => {
    // 1. Pick a deterministic 3-permission subset (all 'cob' actions).
    const allPermsRes = await request(app.getHttpServer())
      .get('/api/permissions')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);

    const cobPerms = (allPermsRes.body as { id: string; action: string }[])
      .filter(p => p.action.startsWith('cob.'))
      .sort((a, b) => a.action.localeCompare(b.action))
      .slice(0, 3);
    expect(cobPerms.length).toBe(3);
    const fullSet = cobPerms.map(p => p.action).sort();

    // 2. Create role R with permission set P.
    const createRoleRes = await request(app.getHttpServer())
      .post('/api/roles')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ label: testRoleLabel })
      .expect(201);
    createdRoleId = createRoleRes.body.id;

    await request(app.getHttpServer())
      .put(`/api/roles/${createdRoleId}/permissions`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(cobPerms.map(p => ({ moduleId: 'cob', permissionId: p.id })))
      .expect(200);

    // 3. Create U1 and U2, both with role R.
    u1Id = await acceptInvite(u1Email, 'E2E Override U1', createdRoleId);
    u2Id = await acceptInvite(u2Email, 'E2E Override U2', createdRoleId);

    // 4. Revoke ONE permission from U1 only: PUT sends U1's full desired
    // granted-permission set (P minus the revoked permission).
    const revoked = cobPerms[0];
    const remainingIds = cobPerms.slice(1).map(p => p.id);

    await request(app.getHttpServer())
      .put(`/api/users/${u1Id}/permissions`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ permissions: remainingIds })
      .expect(200);

    // 5. U1's effective permissions = P minus the revoked permission.
    const u1Token = await loginAndGetToken(u1Email, 'NewUserPass@123');
    const u1MeRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${u1Token}`)
      .expect(200);
    const u1Permissions = (u1MeRes.body.permissions as { id: string; action: string }[])
      .map(p => p.action)
      .sort();
    expect(u1Permissions).toEqual(fullSet.filter(a => a !== revoked.action));

    // 6. U2's effective permissions are unaffected - proving no cross-user leakage.
    const u2Token = await loginAndGetToken(u2Email, 'NewUserPass@123');
    const u2MeRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${u2Token}`)
      .expect(200);
    const u2Permissions = (u2MeRes.body.permissions as { id: string; action: string }[])
      .map(p => p.action)
      .sort();
    expect(u2Permissions).toEqual(fullSet);

    // 7. Exactly one revoke-type row exists for U1, zero for U2.
    const userPermRepo = moduleFixture.get(getRepositoryToken(UserPermission));
    const u1Overrides = await userPermRepo.find({ where: { userId: u1Id } });
    const u2Overrides = await userPermRepo.find({ where: { userId: u2Id } });

    const u1RevokeRows = u1Overrides.filter(o => o.accessType === 'revoke');
    expect(u1RevokeRows).toHaveLength(1);
    expect(u1RevokeRows[0].permissionId).toBe(revoked.id);

    const u2RevokeRows = u2Overrides.filter(o => o.accessType === 'revoke');
    expect(u2RevokeRows).toHaveLength(0);
  });
});
