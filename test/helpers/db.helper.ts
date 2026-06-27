import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../src/modules/users/entities/user.entity';
import { Role } from '../../src/modules/roles/entities/role.entity';
import { LoginOtp } from '../../src/modules/auth/entities/login-otp.entity';
import { UserSession } from '../../src/modules/auth/entities/user-session.entity';
import { PendingInvite } from '../../src/modules/users/entities/pending-invite.entity';
import { ActivityLog } from '../../src/modules/activity-logs/entities/activity-log.entity';
import { LoginChallenge } from '../../src/modules/auth/entities/login-challenge.entity';

export interface TestRole {
  id: string;
  name: string;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  roleId: string;
  name: string;
  status: string;
}

export class DbHelper {
  constructor(private readonly dataSource: DataSource) {}

  get<T>(entity: new () => T): Repository<T> {
    return this.dataSource.getRepository(entity);
  }

  async createRole(overrides: Partial<Role> = {}): Promise<Role> {
    const repo = this.get(Role);
    const role = repo.create({
      name: `test-role-${Date.now()}`,
      label: 'Test Role',
      isSystem: false,
      ...overrides,
    });
    return repo.save(role);
  }

  async createUser(
    roleId: string,
    overrides: Partial<User> & { password?: string } = {},
  ): Promise<User & { password: string }> {
    const { password = 'Test@1234', ...rest } = overrides;
    const repo = this.get(User);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = repo.create({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      userType: 'staff',
      status: 'active',
      passwordHash,
      roleId,
      isDeleted: false,
      ...rest,
    });
    const saved = await repo.save(user);
    return { ...saved, password };
  }

  async getOtpForEmail(email: string): Promise<string | null> {
    const repo = this.get(LoginOtp);
    const otp = await repo.findOne({
      where: { email, isUsed: false },
      order: { createdAt: 'DESC' },
    });
    return otp ? otp.otpHash : null;
  }

  async getLatestOtpRecord(email: string): Promise<LoginOtp | null> {
    return this.get(LoginOtp).findOne({
      where: { email, isUsed: false },
      order: { createdAt: 'DESC' },
    });
  }

  async cleanUsers(emails: string[]): Promise<void> {
    if (!emails.length) return;
    const repo = this.get(User);
    await repo.createQueryBuilder().delete().where('email IN (:...emails)', { emails }).execute();
  }

  async cleanRoles(names: string[]): Promise<void> {
    if (!names.length) return;
    await this.get(Role)
      .createQueryBuilder()
      .delete()
      .where('name IN (:...names)', { names })
      .execute();
  }

  async cleanOtpsForEmail(email: string): Promise<void> {
    await this.get(LoginOtp)
      .createQueryBuilder()
      .delete()
      .where('email = :email', { email })
      .execute();
  }

  async cleanSessionsForUser(userId: string): Promise<void> {
    await this.get(UserSession)
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .execute();
  }

  async cleanInvitesForEmail(email: string): Promise<void> {
    await this.get(PendingInvite)
      .createQueryBuilder()
      .delete()
      .where('email = :email', { email })
      .execute();
  }

  async cleanActivityLogs(userIds: string[]): Promise<void> {
    if (!userIds.length) return;
    await this.get(ActivityLog)
      .createQueryBuilder()
      .delete()
      .where('user_id IN (:...userIds)', { userIds })
      .execute();
  }

  async cleanChallenges(userIds: string[]): Promise<void> {
    if (!userIds.length) return;
    await this.get(LoginChallenge)
      .createQueryBuilder()
      .delete()
      .where('user_id IN (:...userIds)', { userIds })
      .execute();
  }

  async revokeInviteByEmail(email: string): Promise<void> {
    await this.get(PendingInvite)
      .createQueryBuilder()
      .update()
      .set({ status: 'revoked' })
      .where('email = :email', { email })
      .execute();
  }

  async deleteRoleByName(name: string): Promise<void> {
    await this.get(Role).createQueryBuilder().delete().where('name = :name', { name }).execute();
  }

  async cleanAll(userEmails: string[], roleNames: string[] = []): Promise<void> {
    const users = await this.get(User)
      .createQueryBuilder('u')
      .select('u.id')
      .where('u.email IN (:...emails)', { emails: userEmails })
      .getMany();
    const userIds = users.map(u => u.id);

    await this.cleanChallenges(userIds);
    await this.cleanSessionsForUser(userIds.join(',') ? userIds[0] : 'none');
    if (userIds.length > 1) {
      for (const id of userIds.slice(1)) await this.cleanSessionsForUser(id);
    }
    for (const email of userEmails) {
      await this.cleanOtpsForEmail(email);
      await this.cleanInvitesForEmail(email);
    }
    await this.cleanActivityLogs(userIds);
    await this.cleanUsers(userEmails);
    if (roleNames.length) await this.cleanRoles(roleNames);
  }
}
