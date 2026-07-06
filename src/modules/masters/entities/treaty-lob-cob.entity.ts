import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { TreatyLob } from './treaty-lob.entity';
import { CobMaster } from './cob-master.entity';

@Entity('treaty_lob_cobs')
@Unique(['treatyLobId', 'cobId'])
export class TreatyLobCob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'treaty_lob_id', type: 'uuid' })
  treatyLobId: string;

  @ManyToOne(() => TreatyLob, tl => tl.treatyLobCobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_lob_id' })
  treatyLob: TreatyLob;

  @Index()
  @Column({ name: 'cob_id', type: 'uuid' })
  cobId: string;

  @ManyToOne(() => CobMaster, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cob_id' })
  cob: CobMaster;
}
