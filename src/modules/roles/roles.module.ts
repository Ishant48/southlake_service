import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RolesDao } from './dao/roles.dao';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { PermissionCacheModule } from '../../common/cache/permission-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, RolePermission, User]),
    ActivityLogsModule,
    PermissionCacheModule,
  ],
  controllers: [RolesController],
  providers: [RolesService, RolesDao],
  exports: [RolesService, RolesDao],
})
export class RolesModule {}
