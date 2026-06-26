import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from './auth.guard';
import { PermissionGuard } from './permission.guard';
import { UserSession } from '../../entities/user-session.entity';
import { User } from '../../entities/user.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { UserPermission } from '../../entities/user-permission.entity';
import { Permission } from '../../entities/permission.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserSession, User, RolePermission, UserPermission, Permission])],
  providers: [
    AuthGuard,
    PermissionGuard,
    { provide: APP_GUARD, useExisting: AuthGuard },
    { provide: APP_GUARD, useExisting: PermissionGuard },
  ],
  exports: [AuthGuard, PermissionGuard],
})
export class AuthGuardModule {}
