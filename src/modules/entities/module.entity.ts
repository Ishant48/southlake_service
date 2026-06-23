import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiEndpoint } from '../../api-endpoints/entities/api-endpoint.entity';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => ApiEndpoint, (ae) => ae.module)
  endpoints!: ApiEndpoint[];
}
