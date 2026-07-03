import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentTypes1783200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "document_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "PK_document_types" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_document_types_code" UNIQUE ("code")
      )
    `);

    // Let's seed some default document types so they are immediately available
    const defaultTypes = [
      { code: 'LICENSE', name: 'MGA License', desc: 'State-issued MGA operation license' },
      { code: 'TREATY_AGREEMENT', name: 'Treaty Agreement', desc: 'Signed reinsurance treaty contract document' },
      { code: 'RISK_ASSESSMENT', name: 'Risk Assessment Report', desc: 'Underwriting and risk assessment evaluation' },
      { code: 'FINANCIAL_REPORT', name: 'Financial Statement', desc: 'Audited or interim financial statements' },
      { code: 'COMPLIANCE_CERT', name: 'Compliance Certificate', desc: 'Regulatory compliance certification document' }
    ];

    for (const dt of defaultTypes) {
      await queryRunner.query(
        `INSERT INTO document_types (code, name, description, is_active)
         VALUES ($1, $2, $3, true)`,
        [dt.code, dt.name, dt.desc]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "document_types"`);
  }
}
