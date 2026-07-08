import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('mga_master')
export class MgaMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mga_code', type: 'varchar', unique: true })
  mgaCode: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'tax_payable_inhouse', type: 'boolean', default: false })
  taxPayableInhouse: boolean;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'ledger_amount', type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  ledgerAmount: number;

  @Column({ name: 'company_id', type: 'bigint', nullable: true })
  companyId: string | null;

  @Column({ name: 'id_name', type: 'varchar', nullable: true })
  idName: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  zip: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ name: 'open_item', type: 'boolean', default: false })
  openItem: boolean;

  @Column({ name: 'op_start_date', type: 'date', nullable: true })
  opStartDate: Date | string | null;

  @Column({ name: 'other_names', type: 'jsonb', nullable: true })
  otherNames: { state: string; displayName: string }[] | null;

  @Column({ name: 'contact_name', type: 'varchar', nullable: true })
  contactName: string | null;

  @Column({ name: 'contact_email', type: 'varchar', nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', nullable: true })
  contactPhone: string | null;

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
