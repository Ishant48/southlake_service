import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoleEndpoint } from './role-endpoint.entity';
import { RoleModule } from './role-module.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => RoleEndpoint, (re) => re.role)
  roleEndpoints!: RoleEndpoint[];

  @OneToMany(() => RoleModule, (rm) => rm.role)
  roleModules!: RoleModule[];
}
