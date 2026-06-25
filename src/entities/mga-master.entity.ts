import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'ledger_amount', type: 'decimal', precision: 15, scale: 2, default: 0.00 })
  ledgerAmount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;
}
