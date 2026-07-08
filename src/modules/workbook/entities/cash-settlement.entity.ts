import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Workbook } from './workbook.entity';

@Unique(['batchId', 'reinsurerId'])
@Entity('cash_settlements')
export class CashSettlement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  workbookId: number | null;

  @Index()
  @Column({ name: 'batch_id', type: 'uuid' })
  batchId: string;

  @Index()
  @Column({ name: 'reinsurer_id', type: 'uuid' })
  reinsurerId: string;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  begBal: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  netDueAmount: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  amtPaid: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  endBal: number;

  @Index()
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  deletedBy: string | null;

  @OneToOne(() => Workbook, workbook => workbook.cashSettlement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workbookId' })
  workbook: Workbook;
}
