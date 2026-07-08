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
import { UserSession } from './user-session.entity';

@Entity('login_challenges')
export class LoginChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'challenge_token', type: 'varchar', unique: true })
  challengeToken: string;

  @Column({ name: 'existing_session_id', type: 'uuid', nullable: true })
  existingSessionId: string;

  @ManyToOne(() => UserSession, { nullable: true })
  @JoinColumn({ name: 'existing_session_id' })
  existingSession: UserSession;

  @Column({ name: 'new_device_label', type: 'varchar', nullable: true })
  newDeviceLabel: string;

  @Column({ name: 'new_ip_address', type: 'varchar', nullable: true })
  newIpAddress: string;

  @Column({ name: 'new_user_agent', type: 'varchar', nullable: true })
  newUserAgent: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

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
