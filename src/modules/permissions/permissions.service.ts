import { Injectable } from '@nestjs/common';
import { PermissionsDao } from './dao/permissions.dao';
import { Permission } from './entities/permission.entity';
import { Module } from './entities/module.entity';

@Injectable()
export class PermissionsService {
  constructor(private readonly dao: PermissionsDao) {}

  findAll(): Promise<Permission[]> {
    return this.dao.findAllPermissions();
  }

  findAllModules(): Promise<Module[]> {
    return this.dao.findAllModules();
  }
}
