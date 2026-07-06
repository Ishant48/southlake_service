import { Module } from '@nestjs/common';
import { PermissionCacheService } from './permission-cache.service';

/**
 * Leaf module with no dependencies on roles/users, so AuthGuardModule and
 * RolesModule/UsersModule can each import it independently without creating
 * a circular dependency between them.
 */
@Module({
  providers: [PermissionCacheService],
  exports: [PermissionCacheService],
})
export class PermissionCacheModule {}
