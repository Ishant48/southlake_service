import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('treaty_products')
export class TreatyProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_id', type: 'uuid' })
  treatyId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
