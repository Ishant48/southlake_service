import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Module } from '../modules/entities/module.entity';
import { ApiEndpoint } from '../api-endpoints/entities/api-endpoint.entity';
import { Role } from '../roles/entities/role.entity';
import { RoleModule } from '../roles/entities/role-module.entity';
import { RoleEndpoint } from '../roles/entities/role-endpoint.entity';
import { modules, endpointDefinitions } from './seed-data';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Module)
    private readonly modulesRepository: Repository<Module>,
    @InjectRepository(ApiEndpoint)
    private readonly endpointsRepository: Repository<ApiEndpoint>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(RoleModule)
    private readonly roleModulesRepository: Repository<RoleModule>,
    @InjectRepository(RoleEndpoint)
    private readonly roleEndpointsRepository: Repository<RoleEndpoint>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed() {
    await this.seedModules();
    await this.seedEndpoints();
    await this.seedSuperAdminRole();
    await this.seedSuperAdminUser();
  }

  private async seedModules() {
    for (const mod of modules) {
      const exists = await this.modulesRepository.findOneBy({ name: mod.name });
      if (!exists) {
        await this.modulesRepository.save(this.modulesRepository.create(mod));
        this.logger.log(`Module seeded: ${mod.name}`);
      }
    }
  }

  private async seedEndpoints() {
    const existing = await this.endpointsRepository.count();
    if (existing > 0) return;

    for (const def of endpointDefinitions) {
      const module = await this.modulesRepository.findOneBy({ name: def.moduleName });
      if (!module) {
        this.logger.warn(`Module not found for endpoint: ${def.name}`);
        continue;
      }
      await this.endpointsRepository.save(
        this.endpointsRepository.create({
          method: def.method,
          path: def.path,
          name: def.name,
          moduleId: module.id,
        }),
      );
    }
    this.logger.log(`Seeded ${endpointDefinitions.length} API endpoints`);
  }

  private async seedSuperAdminRole() {
    const existing = await this.rolesRepository.findOneBy({ name: 'SuperAdmin' });
    if (existing) return;

    const role = await this.rolesRepository.save(
      this.rolesRepository.create({
        name: 'SuperAdmin',
        description: 'Full system access',
      }),
    );

    const allModules = await this.modulesRepository.find();
    for (const mod of allModules) {
      await this.roleModulesRepository.save(
        this.roleModulesRepository.create({
          roleId: role.id,
          moduleId: mod.id,
        }),
      );
    }
    this.logger.log('SuperAdmin role seeded');
  }

  private async seedSuperAdminUser() {
    const email =
      this.configService.get<string>('SUPER_ADMIN_EMAIL') || 'admin@southlake.com';
    const password =
      this.configService.get<string>('SUPER_ADMIN_PASSWORD') || 'Admin@123';
    const username =
      this.configService.get<string>('SUPER_ADMIN_USERNAME') || 'superadmin';

    const exists = await this.usersRepository.findOneBy({ email });
    if (exists) return;

    const role = await this.rolesRepository.findOneBy({ name: 'SuperAdmin' });
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersRepository.save(
      this.usersRepository.create({
        username,
        email,
        password: hashedPassword,
        isSuperAdmin: true,
        isActive: true,
        roleId: role?.id ?? null,
      }),
    );
    this.logger.log(`Super admin user seeded: ${email}`);
  }
}
