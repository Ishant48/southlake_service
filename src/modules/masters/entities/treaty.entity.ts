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
import { RiskCompany } from './risk-company.entity';
import { TreatyState } from './treaty-state.entity';
import { TreatyMga } from './treaty-mga.entity';
import { TreatyReinsurer } from './treaty-reinsurer.entity';
import { TreatyCarrier } from './treaty-carrier.entity';
import { TreatyProduct } from './treaty-product.entity';
import { TreatyTypeMaster } from './treaty-type-master.entity';
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

  @Index()
  @Column({ name: 'treaty_type_id', type: 'uuid', nullable: true })
  treatyTypeId: string | null;

  @ManyToOne(() => TreatyTypeMaster, { nullable: true })
  @JoinColumn({ name: 'treaty_type_id' })
  treatyType: TreatyTypeMaster | null;

  @Column({ name: 'carrier_allocation_type', type: 'varchar', nullable: true })
  carrierAllocationType: string | null;

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

  @OneToMany(() => TreatyState, ts => ts.treaty, { cascade: true })
  treatyStates: TreatyState[];

  @OneToMany(() => TreatyMga, tm => tm.treaty, { cascade: true })
  treatyMgas: TreatyMga[];

  @OneToMany(() => TreatyReinsurer, tr => tr.treaty, { cascade: true })
  treatyReinsurers: TreatyReinsurer[];

  @OneToMany(() => TreatyCarrier, tc => tc.treaty, { cascade: true })
  treatyCarriers: TreatyCarrier[];

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
