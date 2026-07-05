import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'session_token', type: 'varchar', unique: true })
  sessionToken: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'device_label', type: 'varchar', nullable: true })
  deviceLabel: string;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date;

  @Column({ name: 'revoke_reason', type: 'varchar', nullable: true })
  revokeReason: string;
}
