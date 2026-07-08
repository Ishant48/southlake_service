import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesDao } from './dao/roles.dao';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRoleStatusDto } from './dto/update-role-status.dto';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { PermissionCacheService } from '../../common/cache/permission-cache.service';

export interface UpsertRolePermissionEntry {
  moduleId: string;
  submoduleId?: string;
  permissionId: string;
}

@Injectable()
export class RolesService {
  constructor(
    private readonly dao: RolesDao,
    private readonly activityLogsService: ActivityLogsService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly permissionCache: PermissionCacheService,
  ) {}

  async findAll(
    page = 1,
    perPage = 20,
  ): Promise<{
    data: (Role & { user_count: number })[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const [roles, total] = await this.dao.findAll(page, perPage);
    const data = await Promise.all(
      roles.map(async role => {
        const user_count = await this.userRepo.count({
          where: { roleId: role.id, isDeleted: false },
        });
        return { ...role, user_count };
      }),
    );
    return { data, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async findOne(
    id: string,
  ): Promise<Role & { user_count: number; permissions: { id: string; action: string }[] }> {
    const role = await this.dao.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    const [user_count, rawPerms] = await Promise.all([
      this.userRepo.count({ where: { roleId: id, isDeleted: false } }),
      this.dao.findPermissions(id),
    ]);

    return { ...role, user_count, permissions: this.flattenPermissions(rawPerms) };
  }

  async create(dto: CreateRoleDto, createdBy: User): Promise<Role & { user_count: number }> {
    const existing = await this.dao.findByName(dto.name);
    if (existing) {
      throw new BadRequestException(`Role with name '${dto.name}' already exists`);
    }

    const role = await this.dao.save({
      name: dto.name,
      label: dto.label,
      color: dto.color ?? undefined,
      description: dto.description ?? undefined,
      isSystem: false,
      createdBy: createdBy.id,
    });

    if (dto.permissions && dto.permissions.length > 0) {
      await this.saveFlatPermissions(role.id, dto.permissions);
    }

    await this.activityLogsService.log({
      userId: createdBy.id,
      moduleId: 'user_management',
      action: 'create',
      entityType: 'role',
      entityId: role.id,
      description: `Created role ${role.name}`,
    });

    return { ...role, user_count: 0 };
  }

  async update(
    id: string,
    dto: UpdateRoleDto,
    updatedBy: User,
  ): Promise<Role & { user_count: number }> {
    const role = await this.dao.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    const updateData: Partial<Role> = { updatedBy: updatedBy.id };
    if (dto.label !== undefined) updateData.label = dto.label;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.description !== undefined) updateData.description = dto.description;

    const updated = await this.dao.update(id, updateData);

    if (dto.permissions) {
      await this.saveFlatPermissions(id, dto.permissions);
    }

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'role',
      entityId: id,
      description: `Updated role ${role.name}`,
    });

    const user_count = await this.userRepo.count({ where: { roleId: id, isDeleted: false } });
    return { ...updated, user_count };
  }

  async updateStatus(
    id: string,
    dto: UpdateRoleStatusDto,
    updatedBy: User,
  ): Promise<Role & { user_count: number }> {
    const role = await this.dao.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    if (role.isSystem) {
      throw new BadRequestException('Cannot deactivate system roles');
    }

    const updated = await this.dao.update(id, {
      isActive: dto.status === 'active',
      updatedBy: updatedBy.id,
    });

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'role',
      entityId: id,
      description: `Set role ${role.name} status to ${dto.status}`,
    });

    const user_count = await this.userRepo.count({ where: { roleId: id, isDeleted: false } });
    return { ...updated, user_count };
  }

  async remove(id: string, deletedBy: User): Promise<{ message: string }> {
    const role = await this.dao.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    const assignedCount = await this.userRepo.count({ where: { roleId: id, isDeleted: false } });
    if (assignedCount > 0) {
      throw new BadRequestException(
        `Cannot delete role: ${assignedCount} user(s) are currently assigned to it`,
      );
    }

    await this.dao.delete(id);

    await this.activityLogsService.log({
      userId: deletedBy.id,
      moduleId: 'user_management',
      action: 'delete',
      entityType: 'role',
      entityId: id,
      description: `Deleted role ${role.name}`,
    });

    return { message: 'Role deleted' };
  }

  getPermissions(roleId: string): Promise<RolePermission[]> {
    return this.dao.findPermissions(roleId);
  }

  async upsertPermissions(
    roleId: string,
    permissions: UpsertRolePermissionEntry[],
    updatedBy: User,
  ): Promise<RolePermission[]> {
    const role = await this.dao.findById(roleId);
    if (!role) throw new NotFoundException(`Role ${roleId} not found`);

    const result = await this.dao.upsertPermissions(roleId, permissions);

    // Role permission changes affect every user with this role. There's no
    // cheap way to know which cached users hold this role, and role
    // permission changes are a rare admin action, so a full cache clear is
    // acceptable.
    this.permissionCache.invalidateAll();

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'role_permission',
      entityId: roleId,
      description: `Updated permissions for role ${role.name}`,
    });

    return result;
  }

  async saveFlatPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const allPerms = await this.dao.findAllPermissionsList();
    const permMap = new Map<string, Permission>();
    for (const p of allPerms) {
      permMap.set(p.id, p);
    }

    const upsertEntries: UpsertRolePermissionEntry[] = permissionIds
      .map(pid => {
        const perm = permMap.get(pid);
        if (!perm) return null;
        const parts = perm.action.split('.');
        const prefix = parts.length > 1 ? parts[0] : 'rbac';
        return {
          moduleId: prefix,
          permissionId: pid,
        };
      })
      .filter((entry): entry is UpsertRolePermissionEntry => entry !== null);

    await this.dao.upsertPermissions(roleId, upsertEntries);

    // Same rationale as upsertPermissions(): a role's permissions changed,
    // which affects every user assigned to it.
    this.permissionCache.invalidateAll();
  }

  private flattenPermissions(rawPerms: RolePermission[]): { id: string; action: string }[] {
    return rawPerms
      .filter(rp => rp.permission?.action)
      .map(rp => ({
        id: rp.permission.id,
        action: rp.permission.action,
      }));
  }
}
