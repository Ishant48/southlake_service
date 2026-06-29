import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Workbook } from './workbook.entity';

@Entity('cash_settlements')
export class CashSettlement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  workbookId: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  begBal: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  amtPaid: number;

  @OneToOne(() => Workbook, (workbook) => workbook.cashSettlement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workbookId' })
  workbook: Workbook;
}
