import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChartOfAccount } from './chart-of-account.entity';

@Entity('gl_mappings')
export class GlMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coa_id', type: 'uuid' })
  coaId: string;

  @ManyToOne(() => ChartOfAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'coa_id' })
  coa: ChartOfAccount;

  @Column({ type: 'varchar', unique: true })
  type: string; // 'AR' | 'AP' | 'MGA' | 'BRK'

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;
}
