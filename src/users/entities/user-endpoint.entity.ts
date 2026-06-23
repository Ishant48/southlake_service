import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('user_endpoints')
@Unique(['userId', 'endpointId'])
export class UserEndpoint {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (u) => u.userEndpoints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @Column()
  endpointId!: number;
}
