import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Module } from '../entities/module.entity';

@Injectable()
export class PermissionsDao {
  constructor(
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
    @InjectRepository(Module)
    private readonly moduleRepo: Repository<Module>,
  ) {}

  findAllPermissions(): Promise<Permission[]> {
    return this.permRepo.find({ order: { action: 'ASC' } });
  }

  findAllModules(): Promise<Module[]> {
    return this.moduleRepo.find({
      where: { isActive: true },
      relations: ['submodules'],
      order: { id: 'ASC' },
    });
  }
}
