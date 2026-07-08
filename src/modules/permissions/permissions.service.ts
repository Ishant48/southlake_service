import { Injectable } from '@nestjs/common';
import { PermissionsDao } from './dao/permissions.dao';
import { Permission } from './entities/permission.entity';
import { Module } from './entities/module.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

export interface NavItem {
  id: string;
  label: string;
  icon: string | null;
  route: string | null;
  sortOrder: number;
}

export interface NavGroup extends NavItem {
  children: NavItem[];
}

@Injectable()
export class PermissionsService {
  constructor(
    private readonly dao: PermissionsDao,
    private readonly usersService: UsersService,
  ) {}

  findAll(): Promise<Permission[]> {
    return this.dao.findAllPermissions();
  }

  findAllModules(): Promise<Module[]> {
    return this.dao.findAllModules();
  }

  async getMyModules(user: User): Promise<NavGroup[]> {
    const isSuperAdmin = user.isSuperAdmin || user.role?.name === 'superadmin';
    const effectivePermissions = isSuperAdmin
      ? new Set<string>()
      : new Set(await this.usersService.getEffectivePermissions(user.id));

    const isVisible = (m: Module): boolean => {
      if (isSuperAdmin) return true;
      const action = m.permissionAction ?? `${m.id}.view`;
      return effectivePermissions.has(action);
    };

    const toNavItem = (m: Module): NavItem => ({
      id: m.id,
      label: m.label,
      icon: m.icon,
      route: m.route,
      sortOrder: m.sortOrder,
    });

    const allModules = await this.dao.findNavModules();
    const parents = allModules
      .filter(m => !m.parentModuleId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const tree: NavGroup[] = [];
    for (const parent of parents) {
      const children = allModules
        .filter(m => m.parentModuleId === parent.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .filter(isVisible)
        .map(toNavItem);

      if (children.length > 0) {
        tree.push({ ...toNavItem(parent), children });
      } else if (parent.route && isVisible(parent)) {
        // A parent with no children but its own route+permission acts as a direct link.
        tree.push({ ...toNavItem(parent), children: [] });
      }
    }

    return tree;
  }
}
