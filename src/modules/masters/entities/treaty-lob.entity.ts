import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Treaty } from './treaty.entity';
import { LineOfBusiness } from './line-of-business.entity';
import { TreatyLobCob } from './treaty-lob-cob.entity';

@Entity('treaty_lobs')
@Unique(['treatyId', 'lobId'])
export class TreatyLob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, t => t.treatyLobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_id' })
  treaty: Treaty;

  @Index()
  @Column({ name: 'lob_id', type: 'uuid' })
  lobId: string;

  @ManyToOne(() => LineOfBusiness, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lob_id' })
  lob: LineOfBusiness;

  @OneToMany(() => TreatyLobCob, tlc => tlc.treatyLob, { cascade: true })
  treatyLobCobs: TreatyLobCob[];
}
