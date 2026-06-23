import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { UserEndpoint } from './user-endpoint.entity';
import { UserModule } from './user-module.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  username!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 255, select: false })
  password!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isSuperAdmin!: boolean;

  @ManyToOne(() => Role, { onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'roleId' })
  role!: Role | null;

  @Column({ nullable: true })
  roleId!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => UserEndpoint, (ue) => ue.user)
  userEndpoints!: UserEndpoint[];

  @OneToMany(() => UserModule, (um) => um.user)
  userModules!: UserModule[];
}
