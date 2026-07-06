import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { UserSession } from '../../modules/auth/entities/user-session.entity';
import { User } from '../../modules/users/entities/user.entity';
import { RolePermission } from '../../modules/roles/entities/role-permission.entity';
import { UserPermission } from '../../modules/users/entities/user-permission.entity';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { AuditModule } from '../interceptors/audit.module';
import { PermissionCacheModule } from '../cache/permission-cache.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserSession, User, RolePermission, UserPermission, Permission]),
    AuditModule,
    PermissionCacheModule,
  ],
  providers: [
    AuthGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthGuard],
})
export class AuthGuardModule {}
