import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('chart_of_accounts')
export class ChartOfAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_code', type: 'integer', unique: true })
  accountCode: number;

  @Column({ type: 'varchar', unique: true, nullable: true })
  key: string | null;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => ChartOfAccount, coa => coa.children, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parent_id' })
  parent: ChartOfAccount | null;

  @OneToMany(() => ChartOfAccount, coa => coa.parent)
  children: ChartOfAccount[];

  @Column({ name: 'is_parent', type: 'boolean', default: false })
  isParent: boolean;

  @Column({ name: 'normal_balance', type: 'varchar', nullable: true })
  normalBalance: string | null; // 'debit' | 'credit'

  @Column({ name: 'next_number', type: 'integer', nullable: true })
  nextNumber: number | null;

  @Column({ name: 'earning_account_id', type: 'uuid', nullable: true })
  earningAccountId: string | null;

  @ManyToOne(() => ChartOfAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'earning_account_id' })
  earningAccount: ChartOfAccount | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater: User | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
