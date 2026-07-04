import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('calculation_report_lines')
export class CalculationReportLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treaty_id', type: 'uuid', nullable: true })
  treatyId: string | null;

  @Column({ name: 'line_number', type: 'integer' })
  lineNumber: number;

  @Column({ name: 'line_label', type: 'varchar' })
  lineLabel: string;

  @Column({ name: 'formula_expression', type: 'text', nullable: true })
  formulaExpression: string | null;

  @Column({ name: 'is_bold', type: 'boolean', default: false })
  isBold: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
