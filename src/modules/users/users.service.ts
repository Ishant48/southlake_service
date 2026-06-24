import {
  BadRequestException,
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

export interface UpsertPermissionEntry {
  moduleId: string;
  submoduleId?: string;
  permissionId: string;
  accessType: 'grant' | 'revoke';
}

@Injectable()
export class UsersService {
  constructor(
    private readonly dao: UsersDao,
    private readonly mailService: MailService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(filters: FindUsersFilter): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.dao.findAll(filters);
    return { data, total, page: filters.page || 1, limit: filters.limit || 20 };
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

  getPermissions(userId: string): Promise<UserPermission[]> {
    return this.dao.findUserPermissions(userId);
  }

  async upsertPermissions(
    userId: string,
    permissions: UpsertPermissionEntry[],
    updatedBy: User,
  ): Promise<UserPermission[]> {
    await this.findOne(userId);

    const result = await this.dao.upsertUserPermissions(
      userId,
      permissions.map((p) => ({ ...p, createdBy: updatedBy.id })),
    );

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'user_permission',
      entityId: userId,
      description: `Updated permissions for user ${userId}`,
    });

    return result;
  }
}
