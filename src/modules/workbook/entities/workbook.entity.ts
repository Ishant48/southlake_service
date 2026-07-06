import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { StateExhibit } from './state-exhibit.entity';
import { CashSettlement } from './cash-settlement.entity';

@Entity('workbooks')
export class Workbook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  program: string;

  @Index()
  @Column()
  monthKey: string;

  @Column()
  monthLabel: string;

  @Column({ default: 'FUT' })
  source: string;

  @Column('jsonb', { nullable: true })
  rates: {
    qs?: number;
    cf?: number;
    comm?: number;
    bb?: number;
    ulae?: number;
    xol?: number;
    lr?: number;
    lossPick?: number;
    laeDcc?: number;
    laeAoe?: number;
    boardsCharge?: number;
    lossRatioCap?: number;
  };

  @Column({ default: '1201' })
  mga: string;

  @Column({ default: '000171' })
  lob: string;

  @Column({ default: '' })
  lineDescSuffix: string;

  @Column({ default: '100' })
  comp: string;

  @Column({ default: '000' })
  cc: string;

  @Column({ default: '0000' })
  ext: string;

  @Column({ default: '' })
  sub: string;

  @Index()
  @Column({ default: 'Pending' })
  status: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Index()
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  deletedBy: string | null;

  @OneToMany(() => StateExhibit, exhibit => exhibit.workbook, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  stateExhibits: StateExhibit[];

  @OneToOne(() => CashSettlement, cs => cs.workbook, { cascade: true, onDelete: 'CASCADE' })
  cashSettlement: CashSettlement;
}
