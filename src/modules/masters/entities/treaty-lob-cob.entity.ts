import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TreatyLob } from './treaty-lob.entity';
import { CobMaster } from './cob-master.entity';

@Entity('treaty_lob_cobs')
export class TreatyLobCob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_lob_id', type: 'uuid' })
  treatyLobId: string;

  @ManyToOne(() => TreatyLob, tl => tl.treatyLobCobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_lob_id' })
  treatyLob: TreatyLob;

  @Column({ name: 'cob_id', type: 'uuid' })
  cobId: string;

  @ManyToOne(() => CobMaster, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cob_id' })
  cob: CobMaster;
}
