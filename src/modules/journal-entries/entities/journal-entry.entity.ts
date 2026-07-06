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

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'batch_id', type: 'uuid' })
  batchId: string;

  @ManyToOne(() => JournalEntryBatch, batch => batch.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: JournalEntryBatch;

  @Column({ name: 'je_number', type: 'integer' })
  jeNumber: number; // Journal transaction number (groups balanced debits and credits)

  @Column({ type: 'varchar' })
  description: string;

  @Index()
  @Column({ name: 'coa_id', type: 'uuid' })
  coaId: string;

  @ManyToOne(() => ChartOfAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'coa_id' })
  coa: ChartOfAccount;

  @Column({ type: 'varchar', nullable: true })
  sub: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  debit: number | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  credit: number | null;

  @Index()
  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD format

  @Column({ type: 'varchar', nullable: true })
  dp: string | null;

  @Column({ type: 'varchar', nullable: true })
  policy: string | null;

  @Column({ type: 'varchar', nullable: true })
  memo: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;
}
