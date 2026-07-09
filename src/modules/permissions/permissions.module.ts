import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionResolutionService } from './permission-resolution.service';
import { PermissionsDao } from './dao/permissions.dao';
import { Permission } from './entities/permission.entity';
import { Module } from './entities/module.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { UserPermission } from '../users/entities/user-permission.entity';

@NestModule({
  imports: [TypeOrmModule.forFeature([Permission, Module, RolePermission, UserPermission])],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsDao, PermissionResolutionService],
  exports: [PermissionsService, PermissionResolutionService],
})
export class PermissionsModule {}
