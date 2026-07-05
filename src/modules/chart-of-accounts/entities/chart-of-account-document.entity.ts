import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChartOfAccount } from './chart-of-account.entity';
import { User } from '../../users/entities/user.entity';

@Entity('chart_of_account_documents')
export class ChartOfAccountDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coa_id', type: 'uuid' })
  coaId: string;

  @ManyToOne(() => ChartOfAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coa_id' })
  coa: ChartOfAccount;

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
