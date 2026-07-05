import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('treaty_sequence_prefixes')
export class TreatySequencePrefix {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @Column({ name: 'sequence_prefix_id', type: 'uuid' })
  sequencePrefixId: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
