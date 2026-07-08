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

  @Index()
  @Column({ name: 'entity_type', type: 'varchar', nullable: true })
  entityType: string;

  @Index()
  @Column({ name: 'entity_id', type: 'varchar', nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** Field-level diff for updates: [{ field, oldValue, newValue }]. Null for create/delete/view actions. */
  @Column({ name: 'changes', type: 'jsonb', nullable: true })
  fieldChanges: Array<{ field: string; oldValue: unknown; newValue: unknown }> | null;

  @Column({ type: 'varchar', nullable: true, default: 'success' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  device: string;

  @Column({ type: 'varchar', nullable: true })
  os: string;

  @Column({ type: 'varchar', nullable: true })
  browser: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId: string;

  @Column({ name: 'correlation_id', type: 'varchar', nullable: true })
  correlationId: string;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent: string;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
