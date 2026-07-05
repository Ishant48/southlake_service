import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('carrier_documents')
export class RiskCompanyDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'risk_company_id', type: 'uuid' })
  riskCompanyId: string;

  @Column({ name: 'file_name', type: 'varchar' })
  fileName: string;

  @Column({ name: 'file_url', type: 'varchar' })
  fileUrl: string;

  @Column({ name: 'document_type', type: 'varchar', nullable: true })
  documentType: string | null;

  @Column({ name: 'document_type_id', type: 'uuid', nullable: true })
  documentTypeId: string | null;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt: Date;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
