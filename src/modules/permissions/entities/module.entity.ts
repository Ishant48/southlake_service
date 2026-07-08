import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Submodule } from './submodule.entity';

@Entity('modules')
export class Module {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', nullable: true })
  route: string | null;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ name: 'parent_module_id', type: 'varchar', nullable: true })
  parentModuleId: string | null;

  /** Overrides the default "<id>.view" convention when a module's visibility is gated by a different action (e.g. role.manage). */
  @Column({ name: 'permission_action', type: 'varchar', nullable: true })
  permissionAction: string | null;

  @ManyToOne(() => Module, mod => mod.children)
  @JoinColumn({ name: 'parent_module_id' })
  parent: Module | null;

  @OneToMany(() => Module, mod => mod.parent)
  children: Module[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @OneToMany(() => Submodule, sub => sub.module)
  submodules: Submodule[];
}
