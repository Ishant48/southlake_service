import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { User } from './user.entity';

@Entity('pending_invites')
export class PendingInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'user_type', type: 'varchar', nullable: true })
  userType: string;

  @Column({ type: 'varchar', nullable: true })
  department: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ name: 'user_entity_type', type: 'varchar', nullable: true })
  userEntityType: string;

  @Column({ name: 'user_entity_id', type: 'uuid', nullable: true })
  userEntityId: string;

  @Column({ name: 'invited_by', type: 'uuid', nullable: true })
  invitedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invited_by' })
  invitedByUser: User;

  @CreateDateColumn({ name: 'invited_at', type: 'timestamp' })
  invitedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;
}
