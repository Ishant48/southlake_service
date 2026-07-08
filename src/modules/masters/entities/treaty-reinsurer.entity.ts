import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Treaty } from './treaty.entity';
import { ReinsurerCompany } from './reinsurer-company.entity';
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
    name: 'quota_share',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  quotaShare: number;

  @Index()
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
