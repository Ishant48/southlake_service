import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RoleEndpoint } from './entities/role-endpoint.entity';
import { RoleModule } from './entities/role-module.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(RoleEndpoint)
    private readonly roleEndpointsRepository: Repository<RoleEndpoint>,
    @InjectRepository(RoleModule)
    private readonly roleModulesRepository: Repository<RoleModule>,
  ) {}

  async findAll() {
    return this.rolesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: number) {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['roleEndpoints', 'roleModules'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.rolesRepository.findOneBy({ name: dto.name });
    if (existing) throw new ConflictException('Role name already exists');

    const role = this.rolesRepository.create({ name: dto.name, description: dto.description ?? null });
    return this.rolesRepository.save(role);
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.findById(id);
    if (dto.name && dto.name !== role.name) {
      const existing = await this.rolesRepository.findOneBy({ name: dto.name });
      if (existing) throw new ConflictException('Role name already exists');
    }
    Object.assign(role, dto);
    return this.rolesRepository.save(role);
  }

  async remove(id: number) {
    const role = await this.findById(id);
    return this.rolesRepository.remove(role);
  }

  async assignEndpoints(roleId: number, endpointIds: number[]) {
    await this.findById(roleId);
    await this.roleEndpointsRepository.delete({ roleId });
    const entries = endpointIds.map((endpointId) =>
      this.roleEndpointsRepository.create({ roleId, endpointId }),
    );
    await this.roleEndpointsRepository.save(entries);
    return this.findById(roleId);
  }

  async assignModules(roleId: number, moduleIds: number[]) {
    await this.findById(roleId);
    await this.roleModulesRepository.delete({ roleId });
    const entries = moduleIds.map((moduleId) =>
      this.roleModulesRepository.create({ roleId, moduleId }),
    );
    await this.roleModulesRepository.save(entries);
    return this.findById(roleId);
  }
}
