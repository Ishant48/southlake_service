import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Workbook } from './workbook.entity';

@Entity('state_exhibits')
export class StateExhibit {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  workbookId: number;

  @Index()
  @Column()
  stateCode: string; // e.g., "AZ", "CA", "TOTAL"

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  pw: number[]; // [Prior, Current, YTD]

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  pfw: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  pc: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  pfc: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  tax: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  lp: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  laep: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  ae_paid: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  pe: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  pfe: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  uep: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  lu: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  laeu: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  aeu: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  loss_reserves: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  lae_reserves_dcc: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  lae_reserves_aoe: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  loss_ibnr: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  lae_ibnr_dcc: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  lae_ibnr_aoe: number[];

  @Column('numeric', { array: true, precision: 15, scale: 2, default: [0, 0, 0] })
  ulae_ibnr: number[];

  @Index()
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  deletedBy: string | null;

  @ManyToOne(() => Workbook, workbook => workbook.stateExhibits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workbookId' })
  workbook: Workbook;
}
