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

  findAll(): Promise<Role[]> {
    return this.dao.findAll();
  }

  async create(dto: CreateRoleDto, createdBy: User): Promise<Role> {
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

    await this.activityLogsService.log({
      userId: createdBy.id,
      moduleId: 'user_management',
      action: 'create',
      entityType: 'role',
      entityId: role.id,
      description: `Created role ${role.name}`,
    });

    return role;
  }

  async update(id: string, dto: UpdateRoleDto, updatedBy: User): Promise<Role> {
    const role = await this.dao.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    const updateData: Partial<Role> = { updatedBy: updatedBy.id };
    if (dto.label !== undefined) updateData.label = dto.label;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.description !== undefined) updateData.description = dto.description;

    const updated = await this.dao.update(id, updateData);

    await this.activityLogsService.log({
      userId: updatedBy.id,
      moduleId: 'user_management',
      action: 'edit',
      entityType: 'role',
      entityId: id,
      description: `Updated role ${role.name}`,
    });

    return updated;
  }

  async remove(id: string, deletedBy: User): Promise<{ message: string }> {
    const role = await this.dao.findById(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);

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
}
