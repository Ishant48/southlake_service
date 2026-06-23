import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Module } from '../../modules/entities/module.entity';

@Entity('api_endpoints')
export class ApiEndpoint {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 10 })
  method!: string;

  @Column({ length: 255 })
  path!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => Module, (m) => m.endpoints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module!: Module;

  @Column()
  moduleId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
