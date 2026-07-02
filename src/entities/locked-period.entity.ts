import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('locked_periods')
export class LockedPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  period: string; // e.g. 'June 2026'

  @Column({ name: 'is_locked', type: 'boolean', default: true })
  isLocked: boolean;

  @CreateDateColumn({ name: 'locked_at', type: 'timestamp' })
  lockedAt: Date;

  @Column({ name: 'locked_by', type: 'uuid', nullable: true })
  lockedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locked_by' })
  user: User;
}
