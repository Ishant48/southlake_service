import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Role } from './role.entity';
import { Module } from './module.entity';
import { Submodule } from './submodule.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
@Unique(['roleId', 'moduleId', 'submoduleId', 'permissionId'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'module_id', type: 'varchar' })
  moduleId: string;

  @ManyToOne(() => Module)
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @Column({ name: 'submodule_id', type: 'varchar', nullable: true })
  submoduleId: string;

  @ManyToOne(() => Submodule, { nullable: true })
  @JoinColumn({ name: 'submodule_id' })
  submodule: Submodule;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId: string;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
