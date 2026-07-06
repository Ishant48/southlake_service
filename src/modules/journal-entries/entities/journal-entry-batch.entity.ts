import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JournalEntry } from './journal-entry.entity';

@Entity('journal_entry_batches')
export class JournalEntryBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'batch_number', type: 'varchar', unique: true })
  batchNumber: string;

  @Index()
  @Column({ type: 'varchar' })
  period: string; // e.g. 'June 2026'

  @Column({ name: 'agent_name', type: 'varchar' })
  agentName: string; // e.g. 'Futuristic Underwriters LLC'

  @Index()
  @Column({ name: 'treaty_id', type: 'uuid', nullable: true })
  treatyId: string | null;

  @Index()
  @Column({ name: 'month_key', type: 'varchar', nullable: true })
  monthKey: string | null;

  @Index()
  @Column({ name: 'workbook_id', type: 'integer', nullable: true })
  workbookId: number | null;

  @Index()
  @Column({ name: 'state_code', type: 'varchar', nullable: true })
  stateCode: string | null;

  @Index()
  @Column({ type: 'varchar', default: 'posted' })
  status: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'integer', default: 0 })
  count: number; // Count of distinct journals/JE numbers in the batch

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

  @OneToMany(() => JournalEntry, entry => entry.batch)
  entries: JournalEntry[];
}
