import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

export enum UserType {
  STAFF = 'staff',
  MGA_USER = 'mga_user',
  BROKER_USER = 'broker_user',
  CUSTOMER_USER = 'customer_user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'user_type', type: 'varchar' })
  userType: string;

  @Column({ name: 'user_entity_type', type: 'varchar', nullable: true })
  userEntityType: string;

  @Column({ name: 'user_entity_id', type: 'uuid', nullable: true })
  userEntityId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  initials: string;

  @Column({ name: 'avatar_color', type: 'varchar', length: 7, nullable: true })
  avatarColor: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  department: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true, select: false })
  passwordHash: string | null;

  @Column({ name: 'joined_date', type: 'date', nullable: true })
  joinedDate: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string;

  @Column({ name: 'is_superadmin', type: 'boolean', default: false })
  isSuperAdmin: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
