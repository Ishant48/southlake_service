import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sequence_prefix_master')
export class SequencePrefixMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sequence_type', type: 'varchar', nullable: false })
  sequenceType: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  prefix: string;

  @Column({ name: 'prefix_connector', type: 'varchar', nullable: true })
  prefixConnector: string | null;

  @Column({ name: 'seq_start', type: 'integer', default: 1 })
  seqStart: number;

  @Column({ name: 'next_number', type: 'integer', default: 1 })
  nextNumber: number;

  @Column({ type: 'varchar', nullable: true })
  suffix: string | null;

  @Column({ name: 'suffix_connector', type: 'varchar', nullable: true })
  suffixConnector: string | null;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @Index()
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
