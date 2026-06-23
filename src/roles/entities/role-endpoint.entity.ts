import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, Unique } from 'typeorm';
import { Role } from './role.entity';

@Entity('role_endpoints')
@Unique(['roleId', 'endpointId'])
export class RoleEndpoint {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Role, (r) => r.roleEndpoints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  @Column()
  roleId!: number;

  @Column()
  endpointId!: number;
}
