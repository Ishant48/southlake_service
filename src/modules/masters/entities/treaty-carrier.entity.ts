import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Treaty } from './treaty.entity';
import { RiskCompany } from './risk-company.entity';
import { StateMaster } from './state-master.entity';
import { ColumnNumericTransformer } from '../../../common/utils';

@Entity('treaty_state_carriers')
export class TreatyCarrier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_id' })
  treaty: Treaty;

  @Index()
  @Column({ name: 'carrier_id', type: 'uuid' })
  carrierId: string;

  @ManyToOne(() => RiskCompany, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'carrier_id' })
  carrier: RiskCompany;

  @Column({
    name: 'pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  pct: number;

  @Index()
  @Column({ name: 'state_id', type: 'uuid', nullable: true })
  stateId: string | null;

  @ManyToOne(() => StateMaster, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'state_id' })
  state: StateMaster | null;

  @Index()
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
