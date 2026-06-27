import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Module } from '../../permissions/entities/module.entity';
import { Submodule } from '../../permissions/entities/submodule.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'module_id', type: 'varchar', nullable: true })
  moduleId: string;

  @ManyToOne(() => Module, { nullable: true })
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @Column({ name: 'submodule_id', type: 'varchar', nullable: true })
  submoduleId: string;

  @ManyToOne(() => Submodule, { nullable: true })
  @JoinColumn({ name: 'submodule_id' })
  submodule: Submodule;

  @Column({ type: 'varchar' })
  action: string;

  @Column({ name: 'entity_type', type: 'varchar', nullable: true })
  entityType: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
