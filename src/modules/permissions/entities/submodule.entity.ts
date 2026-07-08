import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Module } from './module.entity';

@Entity('submodules')
export class Submodule {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ name: 'module_id', type: 'varchar' })
  moduleId: string;

  @ManyToOne(() => Module, mod => mod.submodules)
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @Column({ type: 'varchar' })
  label: string;

  @Index()
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
