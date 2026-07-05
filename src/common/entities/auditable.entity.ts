import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Adds who-created/who-last-updated tracking on top of BaseEntity.
 * Extend this for any table that participates in the audit trail.
 */
export abstract class AuditableEntity extends BaseEntity {
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
}
