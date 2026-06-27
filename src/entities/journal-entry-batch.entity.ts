import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ type: 'varchar' })
  period: string; // e.g. 'June 2026'

  @Column({ name: 'agent_name', type: 'varchar' })
  agentName: string; // e.g. 'Futuristic Underwriters LLC'

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

  @OneToMany(() => JournalEntry, (entry) => entry.batch)
  entries: JournalEntry[];
}
