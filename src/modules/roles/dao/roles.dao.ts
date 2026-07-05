import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Injectable()
export class RolesDao {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rpRepo: Repository<RolePermission>,
  ) {}

  findAll(page = 1, limit = 20): Promise<[Role[], number]> {
    return this.roleRepo.findAndCount({
      where: { isDeleted: false },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findById(id: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id } });
  }

  findByName(name: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { name } });
  }

  save(role: Partial<Role>): Promise<Role> {
    return this.roleRepo.save(this.roleRepo.create(role));
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    const role = await this.roleRepo.findOneOrFail({ where: { id } });
    Object.assign(role, data);
    return this.roleRepo.save(role);
  }

  async delete(id: string): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) return;
    role.isDeleted = true;
    role.deletedAt = new Date();
    await this.roleRepo.save(role);
  }

  findPermissions(roleId: string): Promise<RolePermission[]> {
    return this.rpRepo.find({
      where: { roleId },
      relations: ['module', 'submodule', 'permission'],
    });
  }

  async upsertPermissions(
    roleId: string,
    permissions: Array<{
      moduleId: string;
      submoduleId?: string;
      permissionId: string;
    }>,
  ): Promise<RolePermission[]> {
    await this.rpRepo.delete({ roleId });
    const entities = permissions.map(p =>
      this.rpRepo.create({
        roleId,
        moduleId: p.moduleId,
        submoduleId: p.submoduleId ?? undefined,
        permissionId: p.permissionId,
      }),
    );
    return this.rpRepo.save(entities);
  }

  findAllPermissionsList(): Promise<Permission[]> {
    return this.rpRepo.manager.find(Permission);
  }
}
