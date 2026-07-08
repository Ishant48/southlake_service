import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Treaty } from './treaty.entity';
import { ReinsurerCompany } from './reinsurer-company.entity';
import { StateMaster } from './state-master.entity';
import { Broker } from './broker.entity';
import { ColumnNumericTransformer } from '../../../common/utils';

@Entity('treaty_reinsurers')
export class TreatyReinsurer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, t => t.treatyReinsurers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_id' })
  treaty: Treaty;

  @Index()
  @Column({ name: 'reinsurer_id', type: 'uuid' })
  reinsurerId: string;

  @ManyToOne(() => ReinsurerCompany, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reinsurer_id' })
  reinsurer: ReinsurerCompany;

  @Column({
    name: 'cession_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  cessionPct: number;

  @Index()
  @Column({ name: 'state_id', type: 'uuid', nullable: true })
  stateId: string | null;

  @Column({ name: 'state_ids', type: 'jsonb', nullable: true })
  stateIds: string[] | null;

  @ManyToOne(() => StateMaster, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'state_id' })
  state: StateMaster | null;

  @Index()
  @Column({ name: 'broker_id', type: 'uuid', nullable: true })
  brokerId: string | null;

  @ManyToOne(() => Broker, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker | null;

  @Column({ name: 'broker_comm_type', type: 'varchar', nullable: true })
  brokerCommType: string | null;
}
