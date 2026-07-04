import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LineOfBusiness } from './line-of-business.entity';
import { CobMaster } from './cob-master.entity';

@Entity('product_master')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'varchar', unique: true })
  productId: string;

  @Column({ name: 'lob_id', type: 'uuid', nullable: true })
  lobId: string | null;

  @ManyToOne(() => LineOfBusiness, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'lob_id' })
  lob: LineOfBusiness;

  @Column({ name: 'cob_id', type: 'uuid', nullable: true })
  cobId: string | null;

  @ManyToOne(() => CobMaster, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cob_id' })
  cob: CobMaster;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
