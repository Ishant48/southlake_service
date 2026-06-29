import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Treaty } from './treaty.entity';
import { ReinsurerCompany } from './reinsurer-company.entity';

export class ColumnNumericTransformer {
  to(data: number | null): number | null {
    return data;
  }
  from(data: string | null): number | null {
    return data ? parseFloat(data) : null;
  }
}

@Entity('treaty_reinsurers')
export class TreatyReinsurer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, (t) => t.treatyReinsurers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_id' })
  treaty: Treaty;

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
}
