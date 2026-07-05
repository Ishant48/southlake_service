import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsDao } from './dao/permissions.dao';
import { Permission } from './entities/permission.entity';
import { Module } from './entities/module.entity';

@NestModule({
  imports: [TypeOrmModule.forFeature([Permission, Module])],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsDao],
  exports: [PermissionsService],
})
export class PermissionsModule {}
