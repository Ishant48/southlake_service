import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../entities/role.entity';
import { RolePermission } from '../../../entities/role-permission.entity';

@Injectable()
export class RolesDao {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rpRepo: Repository<RolePermission>,
  ) {}

  findAll(): Promise<Role[]> {
    return this.roleRepo.find({ order: { createdAt: 'ASC' } });
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
    await this.roleRepo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.roleRepo.delete(id);
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
    const entities = permissions.map((p) =>
      this.rpRepo.create({
        roleId,
        moduleId: p.moduleId,
        submoduleId: p.submoduleId || null,
        permissionId: p.permissionId,
      }),
    );
    return this.rpRepo.save(entities);
  }
}
