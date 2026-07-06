import { Entity, PrimaryGeneratedColumn, Column, Index, OneToOne, JoinColumn } from 'typeorm';
import { Workbook } from './workbook.entity';

@Entity('cash_settlements')
export class CashSettlement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  workbookId: number;

  @Index()
  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId: string | null;

  @Index()
  @Column({ name: 'reinsurer_id', type: 'uuid', nullable: true })
  reinsurerId: string | null;

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
