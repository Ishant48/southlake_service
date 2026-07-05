import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Treaty } from './treaty.entity';
import { RiskCompany } from './risk-company.entity';
import { StateMaster } from './state-master.entity';
import { Broker } from './broker.entity';
import { ColumnNumericTransformer } from '../../../common/utils';

@Entity('treaty_state_carriers')
export class TreatyCarrier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, t => t.treatyCarriers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_id' })
  treaty: Treaty;

  @Column({ name: 'risk_company_id', type: 'uuid' })
  riskCompanyId: string;

  @ManyToOne(() => RiskCompany, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'risk_company_id' })
  riskCompany: RiskCompany;

  @Column({
    name: 'retention_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  retentionPct: number | null;

  @Column({ name: 'state_id', type: 'uuid', nullable: true })
  stateId: string | null;

  @ManyToOne(() => StateMaster, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'state_id' })
  state: StateMaster | null;

  @Column({ name: 'broker_id', type: 'uuid', nullable: true })
  brokerId: string | null;

  @ManyToOne(() => Broker, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
