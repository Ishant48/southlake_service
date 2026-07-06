import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Treaty } from './treaty.entity';
import { MgaMaster } from './mga-master.entity';

@Entity('treaty_mgas')
@Unique(['treatyId', 'mgaId'])
export class TreatyMga {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, t => t.treatyMgas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_id' })
  treaty: Treaty;

  @Index()
  @Column({ name: 'mga_id', type: 'uuid' })
  mgaId: string;

  @ManyToOne(() => MgaMaster, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mga_id' })
  mga: MgaMaster;
}
