import { Column } from 'typeorm';
import { AuditableEntity } from './auditable.entity';

export abstract class SoftDeleteEntity extends AuditableEntity {
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string;
}
