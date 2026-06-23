import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, Unique } from 'typeorm';
import { Role } from './role.entity';

@Entity('role_modules')
@Unique(['roleId', 'moduleId'])
export class RoleModule {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Role, (r) => r.roleModules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  @Column()
  roleId!: number;

  @Column()
  moduleId!: number;
}
