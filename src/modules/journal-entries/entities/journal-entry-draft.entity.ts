import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JournalEntryBatch } from './journal-entry-batch.entity';
import { ChartOfAccount } from '../../chart-of-accounts/entities/chart-of-account.entity';
import { StateMaster } from '../../masters/entities/state-master.entity';
import { Product } from '../../masters/entities/product.entity';

@Entity('journal_entry_drafts')
export class JournalEntryDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'batch_id', type: 'uuid' })
  batchId: string;

  @ManyToOne(() => JournalEntryBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: JournalEntryBatch;

  @Column({ name: 'je_number', type: 'integer' })
  jeNumber: number;

  @Column({ type: 'varchar' })
  description: string;

  @Index()
  @Column({ name: 'coa_id', type: 'uuid' })
  coaId: string;

  @ManyToOne(() => ChartOfAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'coa_id' })
  coa: ChartOfAccount;

  @Column({ name: 'state_id', type: 'uuid', nullable: true })
  stateId: string | null;

  @ManyToOne(() => StateMaster, { nullable: true })
  @JoinColumn({ name: 'state_id' })
  state: StateMaster | null;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @Column({ type: 'varchar', nullable: true })
  sub: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  credit: number;

  @Column({ type: 'date' })
  date: Date | string;

  @Column({ type: 'varchar', nullable: true })
  dp: string | null;

  @Column({ type: 'varchar', nullable: true })
  policy: string | null;

  @Column({ type: 'text', nullable: true })
  memo: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @Index()
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
