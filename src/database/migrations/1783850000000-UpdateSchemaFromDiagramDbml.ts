import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchemaFromDiagramDbml1783850000000 implements MigrationInterface {
  name = 'UpdateSchemaFromDiagramDbml1783850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename existing legacy tables to match diagram.dbml names
    await queryRunner.query(`ALTER TABLE IF EXISTS "risk_companies" RENAME TO "carriers";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "risk_company_documents" RENAME TO "carrier_documents";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "brokers" RENAME TO "broker_master";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "products" RENAME TO "product_master";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "document_types" RENAME TO "document_type_master";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "sequence_prefix_counters" RENAME TO "sequence_prefix_master";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "treaty_carriers" RENAME TO "treaty_state_carriers";`);

    // 2. Create missing tables defined in diagram.dbml
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mga_other_names" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "mga_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp,
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contact_domain_master" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "mga_id" uuid NOT NULL,
        "domain_name" varchar NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp,
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mga_contact_master" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "mga_id" uuid NOT NULL,
        "contact_name" varchar NOT NULL,
        "contact_email" varchar,
        "contact_phone" varchar,
        "is_primary" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp,
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "broker_documents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "broker_id" uuid NOT NULL,
        "file_name" varchar NOT NULL,
        "file_url" varchar NOT NULL,
        "document_type_id" uuid,
        "uploaded_at" timestamp NOT NULL DEFAULT now(),
        "uploaded_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_lobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "lob_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_cobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "cob_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "treaty_type_master" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "type_code" varchar UNIQUE NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp,
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "treaty_products" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "treaty_sequence_prefixes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "sequence_prefix_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "journal_entry_drafts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "batch_id" uuid NOT NULL,
        "account_code" varchar NOT NULL,
        "account_name" varchar NOT NULL,
        "description" text,
        "debit" numeric(15,2) NOT NULL DEFAULT 0,
        "credit" numeric(15,2) NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "calculation_report_lines" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "treaty_id" uuid,
        "line_number" integer NOT NULL,
        "line_label" varchar NOT NULL,
        "formula_expression" text,
        "is_bold" boolean NOT NULL DEFAULT false,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "treaty_itd_totals" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "year" integer NOT NULL,
        "month" integer NOT NULL,
        "state_id" uuid NOT NULL,
        "pw" numeric(15,2) NOT NULL DEFAULT 0,
        "pfw" numeric(15,2) NOT NULL DEFAULT 0,
        "pc" numeric(15,2) NOT NULL DEFAULT 0,
        "pfc" numeric(15,2) NOT NULL DEFAULT 0,
        "tax" numeric(15,2) NOT NULL DEFAULT 0,
        "lp" numeric(15,2) NOT NULL DEFAULT 0,
        "laep" numeric(15,2) NOT NULL DEFAULT 0,
        "ae_paid" numeric(15,2) NOT NULL DEFAULT 0,
        "pe" numeric(15,2) NOT NULL DEFAULT 0,
        "pfe" numeric(15,2) NOT NULL DEFAULT 0,
        "uep" numeric(15,2) NOT NULL DEFAULT 0,
        "lu" numeric(15,2) NOT NULL DEFAULT 0,
        "laeu" numeric(15,2) NOT NULL DEFAULT 0,
        "aeu" numeric(15,2) NOT NULL DEFAULT 0,
        "loss_reserves" numeric(15,2) NOT NULL DEFAULT 0,
        "lae_reserves_dcc" numeric(15,2) NOT NULL DEFAULT 0,
        "lae_reserves_aoe" numeric(15,2) NOT NULL DEFAULT 0,
        "loss_ibnr" numeric(15,2) NOT NULL DEFAULT 0,
        "lae_ibnr_dcc" numeric(15,2) NOT NULL DEFAULT 0,
        "lae_ibnr_aoe" numeric(15,2) NOT NULL DEFAULT 0,
        "ulae_ibnr" numeric(15,2) NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamp,
        "deleted_by" uuid
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "journal_entry_batches"
      ADD COLUMN IF NOT EXISTS "treaty_id" uuid,
      ADD COLUMN IF NOT EXISTS "month_key" varchar,
      ADD COLUMN IF NOT EXISTS "workbook_id" integer,
      ADD COLUMN IF NOT EXISTS "state_code" varchar,
      ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'posted';
    `);

    await queryRunner.query(`
      ALTER TABLE "carrier_documents"
      ADD COLUMN IF NOT EXISTS "document_type_id" uuid;
    `);

    // 3. Add soft-delete columns (is_deleted, deleted_at, deleted_by) to all tables where missing
    const tablesWithSoftDelete = [
      'roles', 'users', 'permissions', 'modules', 'submodules', 'role_permissions', 'user_permissions',
      'user_sessions', 'login_challenges', 'login_otps', 'pending_invites', 'activity_logs',
      'document_type_master', 'sequence_prefix_master', 'state_master', 'state_documents',
      'mga_master', 'mga_documents', 'carriers', 'carrier_documents', 'reinsurer_companies',
      'broker_master', 'lines_of_business', 'cob_master', 'product_master', 'treaties',
      'treaty_states', 'treaty_state_carriers', 'treaty_mgas', 'treaty_reinsurers',
      'chart_of_accounts', 'chart_of_account_documents', 'gl_mappings', 'journal_entry_batches',
      'journal_entries'
    ];

    for (const t of tablesWithSoftDelete) {
      await queryRunner.query(`
        ALTER TABLE "${t}"
        ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "deleted_at" timestamp,
        ADD COLUMN IF NOT EXISTS "deleted_by" uuid;
      `);
    }

    // Workbooks, state_exhibits, cash_settlements soft delete columns
    await queryRunner.query(`
      ALTER TABLE "workbooks"
      ADD COLUMN IF NOT EXISTS "isDeleted" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp,
      ADD COLUMN IF NOT EXISTS "deletedBy" uuid;
    `);

    await queryRunner.query(`
      ALTER TABLE "state_exhibits"
      ADD COLUMN IF NOT EXISTS "isDeleted" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp,
      ADD COLUMN IF NOT EXISTS "deletedBy" uuid;
    `);

    await queryRunner.query(`
      ALTER TABLE "cash_settlements"
      ADD COLUMN IF NOT EXISTS "batch_id" uuid,
      ADD COLUMN IF NOT EXISTS "reinsurer_id" uuid,
      ADD COLUMN IF NOT EXISTS "netDueAmount" numeric(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "endBal" numeric(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "isDeleted" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp,
      ADD COLUMN IF NOT EXISTS "deletedBy" uuid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "carriers" RENAME TO "risk_companies";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "carrier_documents" RENAME TO "risk_company_documents";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "broker_master" RENAME TO "brokers";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "product_master" RENAME TO "products";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "document_type_master" RENAME TO "document_types";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "sequence_prefix_master" RENAME TO "sequence_prefix_counters";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "treaty_state_carriers" RENAME TO "treaty_carriers";`);
  }
}
