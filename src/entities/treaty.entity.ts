import {
  Column,
  CreateDateColumn,
  Entity,
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

export class ColumnNumericTransformer {
  to(data: number | null): number | null {
    return data;
  }
  from(data: string | null): number | null {
    return data ? parseFloat(data) : null;
  }
}

@Entity('treaties')
export class Treaty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_code', type: 'varchar', unique: true })
  treatyCode: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'mga_id', type: 'uuid', nullable: true })
  mgaId: string | null;

  @ManyToOne(() => MgaMaster, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'mga_id' })
  mga: MgaMaster | null;

  @Column({ name: 'reinsurer_id', type: 'uuid', nullable: true })
  reinsurerId: string | null;

  @ManyToOne(() => ReinsurerCompany, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'reinsurer_id' })
  reinsurer: ReinsurerCompany | null;

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
  @Column({ name: 'qs_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  qsPct: number | null;

  @Column({ name: 'cf_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  cfPct: number | null;

  @Column({ name: 'comm_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  commPct: number | null;

  @Column({ name: 'bb_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  bbPct: number | null;

  @Column({ name: 'ulae_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  ulaePct: number | null;

  @Column({ name: 'xol_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  xolPct: number | null;

  @Column({ name: 'lr_cap_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  lrCapPct: number | null;

  @Column({ name: 'ibnr_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  ibnrPct: number | null;

  // Split
  @Column({ name: 'carrier_retention_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  carrierRetentionPct: number | null;

  @Column({ name: 'reinsurer_cession_pct', type: 'decimal', precision: 6, scale: 2, transformer: new ColumnNumericTransformer(), nullable: true })
  reinsurerCessionPct: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => TreatyLob, (tl) => tl.treaty, { cascade: true })
  treatyLobs: TreatyLob[];

  @OneToMany(() => TreatyState, (ts) => ts.treaty, { cascade: true })
  treatyStates: TreatyState[];

  @OneToMany(() => TreatyMga, (tm) => tm.treaty, { cascade: true })
  treatyMgas: TreatyMga[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;
}
