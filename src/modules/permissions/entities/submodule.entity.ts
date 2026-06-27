import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
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
}
