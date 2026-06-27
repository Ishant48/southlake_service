import { Column, Entity } from 'typeorm';
import { AuditableEntity } from '../../../common/entities';

@Entity('roles')
export class Role extends AuditableEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;
}
