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
import { StateMaster } from './state-master.entity';

@Entity('treaty_states')
@Unique(['treatyId', 'stateId'])
export class TreatyState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, t => t.treatyStates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treaty_id' })
  treaty: Treaty;

  @Index()
  @Column({ name: 'state_id', type: 'uuid' })
  stateId: string;

  @ManyToOne(() => StateMaster, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'state_id' })
  state: StateMaster;
}
