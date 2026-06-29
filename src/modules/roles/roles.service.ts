import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesDao } from './dao/roles.dao';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from '../../entities/role.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { Permission } from '../../entities/permission.entity';
import { User } from '../../entities/user.entity';

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
  ) {}

  async findAll(page = 1, perPage = 20): Promise<{
    data: (Role & { user_count: number })[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const [roles, total] = await this.dao.findAll(page, perPage);
    const data = await Promise.all(
      roles.map(async (role) => {
        const user_count = await this.userRepo.count({ where: { roleId: role.id, isDeleted: false } });
        return { ...role, user_count };
      }),
    );
    return { data, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  async findOne(id: string): Promise<Role & { user_count: number; permissions: { id: string; action: string }[] }> {
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
      color: dto.color || null,
      description: dto.description || null,
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

  async update(id: string, dto: UpdateRoleDto, updatedBy: User): Promise<Role & { user_count: number }> {
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
    const upsertEntries: UpsertRolePermissionEntry[] = permissionIds.map((pid) => ({
      moduleId: 'rbac',
      permissionId: pid,
    }));

    await this.dao.upsertPermissions(roleId, upsertEntries);
  }

  private flattenPermissions(rawPerms: RolePermission[]): { id: string; action: string }[] {
    return rawPerms
      .filter((rp) => rp.permission?.action)
      .map((rp) => ({
        id: rp.permission.id,
        action: rp.permission.action,
      }));
  }
}
