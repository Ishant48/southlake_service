import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Treaty } from './treaty.entity';
import { StateMaster } from './state-master.entity';

@Entity('treaty_states')
export class TreatyState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, (t) => t.treatyStates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_id' })
  treaty: Treaty;

  @Column({ name: 'state_id', type: 'uuid' })
  stateId: string;

  @ManyToOne(() => StateMaster, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'state_id' })
  state: StateMaster;
}
