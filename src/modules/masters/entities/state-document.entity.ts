import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('state_documents')
export class StateDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'state_id', type: 'uuid' })
  stateId: string;

  @Column({ name: 'file_name', type: 'varchar' })
  fileName: string;

  @Column({ name: 'file_url', type: 'varchar' })
  fileUrl: string;

  @Column({ name: 'document_type', type: 'varchar', nullable: true })
  documentType: string | null;

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
