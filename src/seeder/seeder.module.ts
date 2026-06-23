import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Module as ModuleEntity } from '../modules/entities/module.entity';
import { ApiEndpoint } from '../api-endpoints/entities/api-endpoint.entity';
import { Role } from '../roles/entities/role.entity';
import { RoleModule } from '../roles/entities/role-module.entity';
import { RoleEndpoint } from '../roles/entities/role-endpoint.entity';
import { SeederService } from './seeder.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      ModuleEntity,
      ApiEndpoint,
      Role,
      RoleModule,
      RoleEndpoint,
    ]),
  ],
  providers: [SeederService],
})
export class SeederModule {}
