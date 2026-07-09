import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { UserSession } from '../../modules/auth/entities/user-session.entity';
import { User } from '../../modules/users/entities/user.entity';
import { AuditModule } from '../interceptors/audit.module';
import { PermissionCacheModule } from '../cache/permission-cache.module';
import { PermissionsModule } from '../../modules/permissions/permissions.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserSession, User]),
    AuditModule,
    PermissionCacheModule,
    PermissionsModule,
  ],
  providers: [
    AuthGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthGuard],
})
export class AuthGuardModule {}
