import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserPermission } from '../entities/user-permission.entity';
import { PendingInvite } from '../entities/pending-invite.entity';
import { Role } from '../../roles/entities/role.entity';
import { RolePermission } from '../../roles/entities/role-permission.entity';
import { Permission } from '../../permissions/entities/permission.entity';

export interface FindUsersFilter {
  search?: string;
  roleId?: string;
  status?: string;
  userType?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class UsersDao {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserPermission)
    private readonly permRepo: Repository<UserPermission>,
    @InjectRepository(PendingInvite)
    private readonly inviteRepo: Repository<PendingInvite>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async getStats(): Promise<{
    total: number;
    active: number;
    roles_defined: number;
    pending_invites: number;
  }> {
    const [total, active, roles_defined, pending_invites] = await Promise.all([
      this.userRepo.count({ where: { isDeleted: false } }),
      this.userRepo.count({ where: { isDeleted: false, status: 'active' } }),
      this.roleRepo.count({ where: { isDeleted: false } }),
      this.inviteRepo.count({ where: { status: 'pending' } }),
    ]);
    return { total, active, roles_defined, pending_invites };
  }

  findAll(filters: FindUsersFilter): Promise<[User[], number]> {
    const { search, roleId, status, userType, page = 1, limit = 20 } = filters;

    const where: Record<string, unknown>[] = [];
    const baseCondition: Record<string, unknown> = { isDeleted: false };

    if (roleId) baseCondition.roleId = roleId;
    if (status) baseCondition.status = status;
    if (userType) baseCondition.userType = userType;

    if (search) {
      where.push(
        { ...baseCondition, name: ILike(`%${search}%`) },
        { ...baseCondition, email: ILike(`%${search}%`) },
      );
    } else {
      where.push(baseCondition);
    }

    return this.userRepo.findAndCount({
      where,
      relations: ['role'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['role'],
    });
  }

  findRoleById(id: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id } });
  }

  findByIdsWithRole(ids: string[]): Promise<User[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.userRepo.find({ where: { id: In(ids), isDeleted: false }, relations: ['role'] });
  }

  countActiveSuperAdmins(): Promise<number> {
    return this.userRepo
      .createQueryBuilder('u')
      .where('u.is_deleted = false')
      .andWhere('u.status = :status', { status: 'active' })
      .andWhere('u.is_superadmin = true')
      .getCount();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email, isDeleted: false } });
  }

  save(user: Partial<User>): Promise<User> {
    return this.userRepo.save(this.userRepo.create(user));
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.userRepo.findOneOrFail({ where: { id } });
    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ where: { id } });
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = deletedBy;
    await this.userRepo.save(user);
  }

  async deactivateBulk(ids: string[], updatedBy: string): Promise<void> {
    if (!ids.length) return;
    const users = await this.userRepo.find({ where: { id: In(ids), isDeleted: false } });
    if (!users.length) return;
    for (const user of users) {
      user.status = 'inactive';
      user.updatedBy = updatedBy;
    }
    await this.userRepo.save(users);
  }

  findUserPermissions(userId: string): Promise<UserPermission[]> {
    return this.permRepo.find({
      where: { userId },
      relations: ['module', 'submodule', 'permission'],
    });
  }

  async upsertUserPermissions(
    userId: string,
    permissions: Array<{
      moduleId: string;
      submoduleId?: string;
      permissionId: string;
      accessType: string;
      createdBy: string;
    }>,
  ): Promise<UserPermission[]> {
    await this.permRepo.delete({ userId });
    const entities = permissions.map(p =>
      this.permRepo.create({
        userId,
        moduleId: p.moduleId,
        submoduleId: p.submoduleId ?? undefined,
        permissionId: p.permissionId,
        accessType: p.accessType,
        createdBy: p.createdBy,
      }),
    );
    return this.permRepo.save(entities);
  }

  saveInvite(invite: Partial<PendingInvite>): Promise<PendingInvite> {
    return this.inviteRepo.save(this.inviteRepo.create(invite));
  }

  findInviteByToken(token: string): Promise<PendingInvite | null> {
    return this.inviteRepo.findOne({ where: { token } });
  }

  findPendingInvites(): Promise<PendingInvite[]> {
    return this.inviteRepo.find({
      where: { status: 'pending' },
      relations: ['role'],
      order: { invitedAt: 'DESC' },
    });
  }

  async revokeInvite(id: string): Promise<void> {
    const invite = await this.inviteRepo.findOneOrFail({ where: { id } });
    invite.status = 'revoked';
    await this.inviteRepo.save(invite);
  }

  findRolePermissions(roleId: string): Promise<RolePermission[]> {
    return this.userRepo.manager.find(RolePermission, {
      where: { roleId },
      relations: ['module', 'submodule', 'permission'],
    });
  }

  findAllPermissionsList(): Promise<Permission[]> {
    return this.userRepo.manager.find(Permission);
  }
}
