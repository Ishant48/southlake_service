import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { UserSession } from '../../entities/user-session.entity';
import { User } from '../../entities/user.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { UserPermission } from '../../entities/user-permission.entity';
import { Permission } from '../../entities/permission.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserSession,
      User,
      RolePermission,
      UserPermission,
      Permission,
    ]),
  ],
  providers: [
    AuthGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthGuard],
})
export class AuthGuardModule {}
