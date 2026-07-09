import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MgaMaster } from './mga-master.entity';
import { ReinsurerCompany } from './reinsurer-company.entity';
import { RiskCompany } from './risk-company.entity';
import { TreatyLob } from './treaty-lob.entity';
import { TreatyState } from './treaty-state.entity';
import { TreatyMga } from './treaty-mga.entity';
import { TreatyCarrier } from './treaty-carrier.entity';
import { TreatyReinsurer } from './treaty-reinsurer.entity';
import { TreatyProduct } from './treaty-product.entity';
import { ColumnNumericTransformer } from '../../../common/utils';

@Entity('treaties')
export class Treaty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_code', type: 'varchar', unique: true })
  treatyCode: string;

  @Column({ type: 'varchar' })
  name: string;

  @Index()
  @Column({ name: 'mga_id', type: 'uuid', nullable: true })
  mgaId: string | null;

  @ManyToOne(() => MgaMaster, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'mga_id' })
  mga: MgaMaster | null;

  @Index()
  @Column({ name: 'reinsurer_id', type: 'uuid', nullable: true })
  reinsurerId: string | null;

  @ManyToOne(() => ReinsurerCompany, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'reinsurer_id' })
  reinsurer: ReinsurerCompany | null;

  @Index()
  @Column({ name: 'risk_company_id', type: 'uuid', nullable: true })
  riskCompanyId: string | null;

  @ManyToOne(() => RiskCompany, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'risk_company_id' })
  riskCompany: RiskCompany | null;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date | string | null;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate: Date | string | null;

  // Treaty terms
  @Column({
    name: 'qs_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  qsPct: number | null;

  @Column({
    name: 'cf_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  cfPct: number | null;

  @Column({
    name: 'comm_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  commPct: number | null;

  @Column({
    name: 'bb_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  bbPct: number | null;

  @Column({
    name: 'ulae_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  ulaePct: number | null;

  @Column({
    name: 'xol_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  xolPct: number | null;

  @Column({
    name: 'lr_cap_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  lrCapPct: number | null;

  @Column({
    name: 'ibnr_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  ibnrPct: number | null;

  @Column({
    name: 'lae_dcc_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  laeDccPct: number | null;

  @Column({
    name: 'lae_aoe_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  laeAoePct: number | null;

  @Column({
    name: 'carrier_retention_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  carrierRetentionPct: number | null;

  @Column({
    name: 'reinsurer_cession_pct',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  reinsurerCessionPct: number | null;

  @Column({ name: 'treaty_type', type: 'varchar', default: 'Quota Share' })
  treatyType: string;

  @Column({ name: 'ulae_type', type: 'varchar', default: 'percentage' })
  ulaeType: string;

  @Column({ name: 'ulae_basis', type: 'varchar', nullable: true })
  ulaeBasis: string | null;

  @Column({
    name: 'ulae_flat_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  ulaeFlatAmount: number | null;

  @Column({ name: 'policy_seq_prefix', type: 'varchar', nullable: true })
  policySeqPrefix: string | null;

  @Column({ name: 'policy_seq_start', type: 'integer', nullable: true })
  policySeqStart: number | null;

  @Column({ name: 'policy_seq_next', type: 'integer', nullable: true })
  policySeqNext: number | null;

  @Column({ name: 'claim_seq_prefix', type: 'varchar', nullable: true })
  claimSeqPrefix: string | null;

  @Column({ name: 'claim_seq_start', type: 'integer', nullable: true })
  claimSeqStart: number | null;

  @Column({ name: 'claim_seq_next', type: 'integer', nullable: true })
  claimSeqNext: number | null;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_continuous', type: 'boolean', default: false })
  isContinuous: boolean;

  @Column({ name: 'policy_state_connector', type: 'boolean', default: false })
  policyStateConnector: boolean;

  @Column({ name: 'claim_state_connector', type: 'boolean', default: false })
  claimStateConnector: boolean;

  @OneToMany(() => TreatyLob, tl => tl.treaty, { cascade: true })
  treatyLobs: TreatyLob[];

  @OneToMany(() => TreatyState, ts => ts.treaty, { cascade: true })
  treatyStates: TreatyState[];

  @OneToMany(() => TreatyMga, tm => tm.treaty, { cascade: true })
  treatyMgas: TreatyMga[];

  @OneToMany(() => TreatyCarrier, tc => tc.treaty, { cascade: true })
  treatyCarriers: TreatyCarrier[];

  @OneToMany(() => TreatyReinsurer, tr => tr.treaty, { cascade: true })
  treatyReinsurers: TreatyReinsurer[];

  @OneToMany(() => TreatyProduct, tp => tp.treaty, { cascade: true })
  treatyProducts: TreatyProduct[];

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
}
