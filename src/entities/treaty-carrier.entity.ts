import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Treaty } from './treaty.entity';
import { RiskCompany } from './risk-company.entity';

export class ColumnNumericTransformer {
  to(data: number | null): number | null {
    return data;
  }
  from(data: string | null): number | null {
    return data ? parseFloat(data) : null;
  }
}

@Entity('treaty_carriers')
export class TreatyCarrier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, (t) => t.treatyCarriers, { onDelete: 'CASCADE' })
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
    transformer: new ColumnNumericTransformer(),
  })
  retentionPct: number;
}
