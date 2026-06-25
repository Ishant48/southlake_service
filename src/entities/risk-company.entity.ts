import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('risk_companies')
export class RiskCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'risk_company_id', type: 'varchar', unique: true })
  riskCompanyId: string;

  @Column({ name: 'company_id', type: 'bigint', unique: true, nullable: true })
  companyId: number | null;

  @Column({ name: 'id_name', type: 'varchar', nullable: true })
  idName: string | null;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ name: 'is_admitted', type: 'boolean', default: true })
  isAdmitted: boolean;

  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

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
}
