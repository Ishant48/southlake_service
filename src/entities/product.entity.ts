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

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'varchar', unique: true })
  productId: string;

  @Column({ name: 'lob_id', type: 'uuid' })
  lobId: string;

  @ManyToOne(() => LineOfBusiness, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lob_id' })
  lob: LineOfBusiness;

  @Column({ name: 'cob_id', type: 'uuid' })
  cobId: string;

  @ManyToOne(() => CobMaster, { onDelete: 'RESTRICT' })
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
}
