import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UsersDao, FindUsersFilter } from './dao/users.dao';
import { MailService } from '../mail/mail.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { User } from '../../entities/user.entity';
import { UserPermission } from '../../entities/user-permission.entity';
import { PendingInvite } from '../../entities/pending-invite.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { Permission } from '../../entities/permission.entity';

export interface UpsertPermissionEntry {
  moduleId: string;
  submoduleId?: string;
  permissionId: string;
  accessType: 'grant' | 'revoke';
  createdBy: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly dao: UsersDao,
    private readonly mailService: MailService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly configService: ConfigService,
  ) {}

  async getStats(): Promise<{ total: number; active: number; roles_defined: number; pending_invites: number }> {
    return this.dao.getStats();
  }

  async findAll(filters: FindUsersFilter): Promise<{ data: User[]; total: number; page: number; per_page: number; total_pages: number }> {
    const [data, total] = await this.dao.findAll(filters);
    const perPage = filters.limit || 20;
    const page = filters.page || 1;
    return {
      data,
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.dao.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async invite(dto: InviteUserDto, invitedBy: User): Promise<{ message: string }> {
    const existing = await this.dao.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException(`A user with email ${dto.email} already exists`);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.dao.saveInvite({
      email: dto.email,
      name: dto.name,
      roleId: dto.role_id,
      userType: dto.user_type || null,
      department: dto.department || null,
      title: dto.title || null,
      userEntityType: dto.user_entity_type || null,
      userEntityId: dto.user_entity_id || null,
      invitedBy: invitedBy.id,
      expiresAt,
      token,
      status: 'pending',
    });

    const appUrl = this.configService.get<string>('app.appUrl');
    const inviteLink = `${appUrl}/accept-invite?token=${token}`;
    await this.mailService.sendInvite(dto.email, dto.name, inviteLink, invitedBy.name);

    await this.activityLogsService.log({
      userId: invitedBy.id,
      moduleId: 'user_management',
      action: 'create',
      entityType: 'pending_invite',
      description: `Invited ${dto.email}`,
    });

    return { message: `Invitation sent to ${dto.email}` };
  }

  async update(id: string, dto: UpdateUserDto, updatedBy: User): Promise<User> {
    await this.findOne(id);

    if (dto.role_id !== undefined && id === updatedBy.id && !updatedBy.isSuperAdmin) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const updateData: Partial<User> = { updatedBy: updatedBy.id };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.initials !== undefined) updateData.initials = dto.initials;
    if (dto.avatar_color !== undefined) updateData.avatarColor = dto.avatar_color;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.role_id !== undefined) updateData.roleId = dto.role_id;
    if (dto.joined_date !== undefined) updateData.joinedDate = new Date(dto.joined_date);

    const updated = await this.dao.update(id, updateData);

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'user',
      entityId: id,
      description: `Updated user ${id}`,
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, updatedBy: User): Promise<User> {
    await this.findOne(id);
    const updated = await this.dao.update(id, { status: dto.status, updatedBy: updatedBy.id });

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'user',
      entityId: id,
      description: `Set user ${id} status to ${dto.status}`,
    });

    return updated;
  }

  async deactivate(id: string, updatedBy: User): Promise<{ message: string }> {
    await this.findOne(id);
    await this.dao.update(id, { status: 'inactive', updatedBy: updatedBy.id });

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'user',
      entityId: id,
      description: `Deactivated user ${id}`,
    });

    return { message: 'User deactivated' };
  }

  async deactivateBulk(ids: string[], updatedBy: User): Promise<{ message: string; count: number }> {
    await this.dao.deactivateBulk(ids, updatedBy.id);

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'user',
      description: `Bulk deactivated ${ids.length} users`,
    });

    return { message: `${ids.length} users deactivated`, count: ids.length };
  }

  async remove(id: string, deletedBy: User): Promise<{ message: string }> {
    await this.findOne(id);
    await this.dao.softDelete(id, deletedBy.id);

    await this.activityLogsService.log({
      userId: deletedBy.id,
      moduleId: 'user_management',
      action: 'delete',
      entityType: 'user',
      entityId: id,
      description: `Soft deleted user ${id}`,
    });

    return { message: 'User deleted' };
  }

  async getPermissions(userId: string): Promise<{ id: string; action: string }[]> {
    const user = await this.findOne(userId);
    const roleId = user.roleId;

    const [rolePerms, userOverrides] = await Promise.all([
      roleId ? this.dao.findRolePermissions(roleId) : Promise.resolve([]),
      this.dao.findUserPermissions(userId),
    ]);

    const permissionSet = new Map<string, { id: string; action: string; accessType: string }>();

    for (const rp of rolePerms) {
      if (rp.permission?.action) {
        permissionSet.set(rp.permission.id, {
          id: rp.permission.id,
          action: rp.permission.action,
          accessType: 'grant',
        });
      }
    }

    for (const up of userOverrides) {
      if (up.permission?.action) {
        if (up.accessType === 'grant') {
          permissionSet.set(up.permission.id, {
            id: up.permission.id,
            action: up.permission.action,
            accessType: 'grant',
          });
        } else if (up.accessType === 'revoke') {
          permissionSet.delete(up.permission.id);
        }
      }
    }

    return Array.from(permissionSet.values()).map(({ id, action }) => ({ id, action }));
  }

  async upsertPermissions(
    userId: string,
    permissionIds: string[],
    updatedBy: User,
  ): Promise<{ id: string; action: string }[]> {
    const user = await this.findOne(userId);

    if (userId === updatedBy.id && !updatedBy.isSuperAdmin) {
      throw new ForbiddenException('You cannot modify your own permissions');
    }

    const overrides: UpsertPermissionEntry[] = permissionIds.map((pid) => ({
      moduleId: 'rbac',
      permissionId: pid,
      accessType: 'grant',
      createdBy: updatedBy.id,
    }));

    await this.dao.upsertUserPermissions(userId, overrides);

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'user_permission',
      entityId: userId,
      description: `Updated permissions for user ${userId}`,
    });

    return this.getPermissions(userId);
  }

  async getEffectivePermissions(userId: string): Promise<string[]> {
    const user = await this.findOne(userId);

    if (user.role?.name === 'superadmin') {
      const allPerms = await this.dao.findAllPermissionsList();
      return allPerms.map(p => p.action);
    }

    const permissionSet = new Set<string>();

    if (user.roleId) {
      const rolePerms = await this.dao.findRolePermissions(user.roleId);
      for (const rp of rolePerms) {
        if (rp.permission?.action) {
          permissionSet.add(rp.permission.action);
        }
      }
    }

    const userPerms = await this.dao.findUserPermissions(userId);
    for (const up of userPerms) {
      if (up.permission?.action) {
        if (up.accessType === 'grant') {
          permissionSet.add(up.permission.action);
        } else if (up.accessType === 'revoke') {
          permissionSet.delete(up.permission.action);
        }
      }
    }

    return Array.from(permissionSet);
  }

  getPendingInvites(): Promise<PendingInvite[]> {
    return this.dao.findPendingInvites();
  }

  async revokeInvite(id: string, revokedBy: User): Promise<{ message: string }> {
    await this.dao.revokeInvite(id);

    await this.activityLogsService.log({
      userId: revokedBy.id,
      moduleId: 'user_management',
      action: 'delete',
      entityType: 'pending_invite',
      entityId: id,
      description: `Revoked invite ${id}`,
    });

    return { message: 'Invite revoked' };
  }
}
