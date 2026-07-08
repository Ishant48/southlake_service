import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { UserPermission } from '../users/entities/user-permission.entity';
import { Permission } from './entities/permission.entity';

export interface EffectivePermission {
  id: string;
  action: string;
  moduleId: string | null;
}

/**
 * The minimal shape this service needs from a User to resolve permissions.
 * Superadmin status is decided solely by the `is_superadmin` column - role
 * names are arbitrary, user-creatable data and must never be checked for
 * authorization/bypass decisions.
 */
export interface PermissionSubject {
  id: string;
  roleId: string;
  isSuperAdmin: boolean;
}

/**
 * Single source of truth for "what permissions does this user effectively
 * have". Used by AuthGuard (per-request authorization), UsersService
 * (permission read/verify-otp/me responses), and PermissionsService
 * (sidebar nav) - previously each had its own drifted copy of this merge.
 */
@Injectable()
export class PermissionResolutionService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private readonly userPermRepo: Repository<UserPermission>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
  ) {}

  isSuperAdmin(user: PermissionSubject): boolean {
    return user.isSuperAdmin;
  }

  async resolveEffectivePermissions(user: PermissionSubject): Promise<EffectivePermission[]> {
    if (this.isSuperAdmin(user)) {
      const allPerms = await this.permRepo.find();
      return allPerms.map(p => ({ id: p.id, action: p.action, moduleId: null }));
    }

    const permissionMap = new Map<string, EffectivePermission>();

    if (user.roleId) {
      const rolePerms = await this.rolePermRepo.find({
        where: { roleId: user.roleId },
        relations: ['permission'],
      });
      for (const rp of rolePerms) {
        if (rp.permission?.action) {
          permissionMap.set(rp.permission.id, {
            id: rp.permission.id,
            action: rp.permission.action,
            moduleId: rp.moduleId,
          });
        }
      }
    }

    const userPerms = await this.userPermRepo.find({
      where: { userId: user.id },
      relations: ['permission'],
    });
    for (const up of userPerms) {
      if (up.permission?.action) {
        if (up.accessType === 'grant') {
          permissionMap.set(up.permission.id, {
            id: up.permission.id,
            action: up.permission.action,
            moduleId: up.moduleId,
          });
        } else if (up.accessType === 'revoke') {
          permissionMap.delete(up.permission.id);
        }
      }
    }

    return Array.from(permissionMap.values());
  }
}
