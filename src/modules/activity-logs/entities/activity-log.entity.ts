import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'module_id', type: 'varchar', nullable: true })
  moduleId: string;

  @ManyToOne(() => Module, { nullable: true })
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @Index()
  @Column({ name: 'submodule_id', type: 'varchar', nullable: true })
  submoduleId: string;

  @ManyToOne(() => Submodule, { nullable: true })
  @JoinColumn({ name: 'submodule_id' })
  submodule: Submodule;

  @Index()
  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent: string;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Index()
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
