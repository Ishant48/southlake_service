import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaSync1783230000000 implements MigrationInterface {
  name = 'SchemaSync1783230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===================================================================
    // DROP ALL EXISTING TABLES (reverse dependency order)
    // ===================================================================

    // --- Group 5: Accounting / GL (leaf tables first) ---
    await queryRunner.query(`DROP TABLE IF EXISTS "cash_settlements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "calculation_report_lines" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_entries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_entry_drafts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_entry_batches" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gl_mappings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chart_of_account_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chart_of_accounts" CASCADE`);

    // --- Group 4: Workbook ---
    await queryRunner.query(`DROP TABLE IF EXISTS "state_exhibits" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workbooks" CASCADE`);

    // --- Group 3: Treaty ---
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_itd_totals" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_sequence_prefixes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_reinsurers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_mgas" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_state_carriers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_states" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaties" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_type_master" CASCADE`);

    // --- Group 2: Masters ---
    await queryRunner.query(`DROP TABLE IF EXISTS "carrier_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mga_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mga_contact_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mga_other_names" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "state_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_cobs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_lobs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sequence_prefix_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_type_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_domain_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "locked_periods" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "state_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cob_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lines_of_business" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reinsurer_companies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carriers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mga_master" CASCADE`);

    // --- Group 1: Auth & RBAC ---
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "login_challenges" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pending_invites" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "login_otps" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "submodules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "modules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);

    // --- old removed tables (cleanup) ---
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_lob_cobs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_lobs" CASCADE`);

    // ===================================================================
    // CREATE ALL TABLES (dependency order)
    // ===================================================================

    // -------------------- GROUP 1: Auth & RBAC --------------------

    // 1. roles
    await queryRunner.query(
      `CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "label" character varying NOT NULL,
        "color" character varying(7),
        "description" text,
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )`,
    );

    // 2. users
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "role_id" uuid NOT NULL,
        "user_type" character varying NOT NULL,
        "name" character varying NOT NULL,
        "initials" character varying(4),
        "avatar_color" character varying(7),
        "phone" character varying,
        "department" character varying,
        "title" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "password_hash" character varying,
        "joined_date" date,
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "deleted_by" uuid,
        "is_superadmin" boolean NOT NULL DEFAULT false,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )`,
    );

    // 3. permissions
    await queryRunner.query(
      `CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" character varying NOT NULL,
        "label" character varying NOT NULL,
        "description" character varying,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_permissions_action" UNIQUE ("action"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )`,
    );

    // 4. modules
    await queryRunner.query(
      `CREATE TABLE "modules" (
        "id" character varying NOT NULL,
        "label" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_modules" PRIMARY KEY ("id")
      )`,
    );

    // 5. submodules
    await queryRunner.query(
      `CREATE TABLE "submodules" (
        "id" character varying NOT NULL,
        "module_id" character varying NOT NULL,
        "label" character varying NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_submodules" PRIMARY KEY ("id")
      )`,
    );

    // 6. user_sessions
    await queryRunner.query(
      `CREATE TABLE "user_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "session_token" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "device_label" character varying,
        "ip_address" character varying,
        "user_agent" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        "revoked_at" TIMESTAMP,
        "revoke_reason" character varying,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_user_sessions_session_token" UNIQUE ("session_token"),
        CONSTRAINT "PK_user_sessions" PRIMARY KEY ("id")
      )`,
    );

    // 7. login_otps
    await queryRunner.query(
      `CREATE TABLE "login_otps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "otp_hash" character varying NOT NULL,
        "attempt_count" integer NOT NULL DEFAULT 0,
        "is_used" boolean NOT NULL DEFAULT false,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_login_otps" PRIMARY KEY ("id")
      )`,
    );

    // 8. pending_invites
    await queryRunner.query(
      `CREATE TABLE "pending_invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "role_id" uuid,
        "user_type" character varying,
        "department" character varying,
        "title" character varying,
        "invited_by" uuid,
        "invited_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        "token" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_pending_invites_token" UNIQUE ("token"),
        CONSTRAINT "PK_pending_invites" PRIMARY KEY ("id")
      )`,
    );

    // 9. role_permissions
    await queryRunner.query(
      `CREATE TABLE "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role_id" uuid NOT NULL,
        "module_id" character varying NOT NULL,
        "submodule_id" character varying,
        "permission_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_role_permissions" UNIQUE ("role_id", "module_id", "submodule_id", "permission_id"),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id")
      )`,
    );

    // 10. user_permissions
    await queryRunner.query(
      `CREATE TABLE "user_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "module_id" character varying NOT NULL,
        "submodule_id" character varying,
        "permission_id" uuid NOT NULL,
        "access_type" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_user_permissions" PRIMARY KEY ("id")
      )`,
    );

    // 11. login_challenges
    await queryRunner.query(
      `CREATE TABLE "login_challenges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "challenge_token" character varying NOT NULL,
        "existing_session_id" uuid,
        "new_device_label" character varying,
        "new_ip_address" character varying,
        "new_user_agent" character varying,
        "status" character varying NOT NULL DEFAULT 'pending',
        "expires_at" TIMESTAMP NOT NULL,
        "resolved_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_login_challenges_challenge_token" UNIQUE ("challenge_token"),
        CONSTRAINT "PK_login_challenges" PRIMARY KEY ("id")
      )`,
    );

    // 12. activity_logs
    await queryRunner.query(
      `CREATE TABLE "activity_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "module_id" character varying,
        "submodule_id" character varying,
        "action" character varying NOT NULL,
        "description" text,
        "oldValues" jsonb,
        "newValues" jsonb,
        "changes" jsonb,
        "ip_address" character varying,
        "user_agent" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_activity_logs" PRIMARY KEY ("id")
      )`,
    );

    // -------------------- GROUP 2: Masters --------------------

    // 13. document_type_master
    await queryRunner.query(
      `CREATE TABLE "document_type_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type_code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_document_type_master_type_code" UNIQUE ("type_code"),
        CONSTRAINT "UQ_document_type_master_name" UNIQUE ("name"),
        CONSTRAINT "PK_document_type_master" PRIMARY KEY ("id")
      )`,
    );

    // 14. contact_domain_master
    await queryRunner.query(
      `CREATE TABLE "contact_domain_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "domain_code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_contact_domain_master_domain_code" UNIQUE ("domain_code"),
        CONSTRAINT "UQ_contact_domain_master_name" UNIQUE ("name"),
        CONSTRAINT "PK_contact_domain_master" PRIMARY KEY ("id")
      )`,
    );

    // 15. state_master
    await queryRunner.query(
      `CREATE TABLE "state_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "state_code" integer,
        "state_abbr" character varying NOT NULL,
        "name" character varying NOT NULL,
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_state_master_state_code" UNIQUE ("state_code"),
        CONSTRAINT "UQ_state_master_state_abbr" UNIQUE ("state_abbr"),
        CONSTRAINT "PK_state_master" PRIMARY KEY ("id")
      )`,
    );

    // 16. mga_master
    await queryRunner.query(
      `CREATE TABLE "mga_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mga_code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "ledger_amount" numeric(15,2) NOT NULL DEFAULT 0,
        "company_id" bigint,
        "id_name" character varying,
        "address" character varying,
        "zip" character varying,
        "city" character varying,
        "state" character varying,
        "phone" character varying,
        "open_item" boolean NOT NULL DEFAULT false,
        "op_start_date" date,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_mga_master_mga_code" UNIQUE ("mga_code"),
        CONSTRAINT "PK_mga_master" PRIMARY KEY ("id")
      )`,
    );

    // 17. carriers (formerly risk_companies)
    await queryRunner.query(
      `CREATE TABLE "carriers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "risk_company_id" character varying NOT NULL,
        "company_id" bigint,
        "id_name" character varying,
        "name" character varying NOT NULL,
        "phone" character varying,
        "is_admitted" boolean NOT NULL DEFAULT true,
        "state" character varying,
        "address" character varying,
        "zip" character varying,
        "city" character varying,
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_carriers_risk_company_id" UNIQUE ("risk_company_id"),
        CONSTRAINT "UQ_carriers_company_id" UNIQUE ("company_id"),
        CONSTRAINT "PK_carriers" PRIMARY KEY ("id")
      )`,
    );

    // 18. reinsurer_companies
    await queryRunner.query(
      `CREATE TABLE "reinsurer_companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reinsurer_company_id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_reinsurer_companies_reinsurer_company_id" UNIQUE ("reinsurer_company_id"),
        CONSTRAINT "PK_reinsurer_companies" PRIMARY KEY ("id")
      )`,
    );

    // 19. broker_master
    await queryRunner.query(
      `CREATE TABLE "broker_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "broker_code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "contact_name" character varying,
        "email" character varying,
        "phone" character varying,
        "license_number" character varying,
        "company_id" bigint,
        "id_name" character varying,
        "address" character varying,
        "city" character varying,
        "state" character varying,
        "zip" character varying,
        "commission_pct" numeric(6,2),
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_broker_master_broker_code" UNIQUE ("broker_code"),
        CONSTRAINT "PK_broker_master" PRIMARY KEY ("id")
      )`,
    );

    // 20. lines_of_business
    await queryRunner.query(
      `CREATE TABLE "lines_of_business" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "lob_code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "type" character varying,
        "taxable" boolean NOT NULL DEFAULT false,
        "priority" integer NOT NULL DEFAULT 1,
        "fully_earned" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_lines_of_business_lob_code" UNIQUE ("lob_code"),
        CONSTRAINT "PK_lines_of_business" PRIMARY KEY ("id")
      )`,
    );

    // 21. cob_master
    await queryRunner.query(
      `CREATE TABLE "cob_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cob_code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "type" character varying,
        "taxable" boolean NOT NULL DEFAULT false,
        "priority" integer NOT NULL DEFAULT 1,
        "fully_earned" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_cob_master_cob_code" UNIQUE ("cob_code"),
        CONSTRAINT "PK_cob_master" PRIMARY KEY ("id")
      )`,
    );

    // 22. product_master
    await queryRunner.query(
      `CREATE TABLE "product_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_product_master_product_code" UNIQUE ("product_code"),
        CONSTRAINT "PK_product_master" PRIMARY KEY ("id")
      )`,
    );

    // 23. sequence_prefix_master
    await queryRunner.query(
      `CREATE TABLE "sequence_prefix_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sequence_type" character varying NOT NULL,
        "name" character varying NOT NULL,
        "prefix" character varying NOT NULL,
        "prefix_connector" character varying,
        "seq_start" integer NOT NULL DEFAULT 1,
        "next_number" integer NOT NULL DEFAULT 1,
        "suffix" character varying,
        "suffix_connector" character varying,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_sequence_prefix_master" PRIMARY KEY ("id")
      )`,
    );

    // 24. state_documents
    await queryRunner.query(
      `CREATE TABLE "state_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "state_id" uuid NOT NULL,
        "document_type_id" uuid NOT NULL,
        "file_name" character varying NOT NULL,
        "file_url" character varying NOT NULL,
        "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
        "uploaded_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_state_documents" PRIMARY KEY ("id")
      )`,
    );

    // 25. mga_other_names
    await queryRunner.query(
      `CREATE TABLE "mga_other_names" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mga_id" uuid NOT NULL,
        "state_id" uuid NOT NULL,
        "display_name" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_mga_other_names" PRIMARY KEY ("id")
      )`,
    );

    // 26. mga_documents
    await queryRunner.query(
      `CREATE TABLE "mga_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mga_id" uuid NOT NULL,
        "document_type_id" uuid NOT NULL,
        "file_name" character varying NOT NULL,
        "file_url" character varying NOT NULL,
        "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
        "uploaded_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_mga_documents" PRIMARY KEY ("id")
      )`,
    );

    // 27. mga_contact_master
    await queryRunner.query(
      `CREATE TABLE "mga_contact_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mga_id" uuid NOT NULL,
        "domain_id" uuid NOT NULL,
        "contact_name" character varying NOT NULL,
        "designation" character varying,
        "email" character varying,
        "phone" character varying,
        "mobile" character varying,
        "is_primary" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_mga_contact_master" PRIMARY KEY ("id")
      )`,
    );

    // 28. carrier_documents (formerly risk_company_documents)
    await queryRunner.query(
      `CREATE TABLE "carrier_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "carrier_id" uuid NOT NULL,
        "document_type_id" uuid NOT NULL,
        "file_name" character varying NOT NULL,
        "file_url" character varying NOT NULL,
        "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
        "uploaded_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_carrier_documents" PRIMARY KEY ("id")
      )`,
    );

    // 29. broker_documents
    await queryRunner.query(
      `CREATE TABLE "broker_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "broker_id" uuid NOT NULL,
        "document_type_id" uuid NOT NULL,
        "file_name" character varying NOT NULL,
        "file_url" character varying NOT NULL,
        "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
        "uploaded_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_broker_documents" PRIMARY KEY ("id")
      )`,
    );

    // 30. product_lobs
    await queryRunner.query(
      `CREATE TABLE "product_lobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "lob_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_product_lobs" PRIMARY KEY ("id")
      )`,
    );

    // 31. product_cobs
    await queryRunner.query(
      `CREATE TABLE "product_cobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "cob_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_product_cobs" PRIMARY KEY ("id")
      )`,
    );

    // 32. locked_periods
    await queryRunner.query(
      `CREATE TABLE "locked_periods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "period" character varying NOT NULL,
        "is_locked" boolean NOT NULL DEFAULT true,
        "locked_at" TIMESTAMP NOT NULL DEFAULT now(),
        "locked_by" uuid,
        CONSTRAINT "UQ_locked_periods_period" UNIQUE ("period"),
        CONSTRAINT "PK_locked_periods" PRIMARY KEY ("id")
      )`,
    );

    // -------------------- GROUP 3: Treaty --------------------

    // 33. treaty_type_master
    await queryRunner.query(
      `CREATE TABLE "treaty_type_master" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type_code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_treaty_type_master_type_code" UNIQUE ("type_code"),
        CONSTRAINT "UQ_treaty_type_master_name" UNIQUE ("name"),
        CONSTRAINT "PK_treaty_type_master" PRIMARY KEY ("id")
      )`,
    );

    // 34. treaties
    await queryRunner.query(
      `CREATE TABLE "treaties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "treaty_code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "mga_id" uuid,
        "risk_company_id" uuid,
        "treaty_type_id" uuid,
        "carrier_allocation_type" character varying,
        "effective_date" date,
        "expiration_date" date,
        "qs_pct" numeric(6,2),
        "cf_pct" numeric(6,2),
        "comm_pct" numeric(6,2),
        "bb_pct" numeric(6,2),
        "ulae_pct" numeric(6,2),
        "xol_pct" numeric(6,2),
        "lr_cap_pct" numeric(6,2),
        "ibnr_pct" numeric(6,2),
        "lae_dcc_pct" numeric(6,2),
        "lae_aoe_pct" numeric(6,2),
        "ulae_type" character varying NOT NULL DEFAULT 'percentage',
        "ulae_basis" character varying,
        "ulae_flat_amount" numeric(15,2),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_treaties_treaty_code" UNIQUE ("treaty_code"),
        CONSTRAINT "PK_treaties" PRIMARY KEY ("id")
      )`,
    );

    // 35. treaty_products
    await queryRunner.query(
      `CREATE TABLE "treaty_products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_treaty_products" PRIMARY KEY ("id")
      )`,
    );

    // 36. treaty_states
    await queryRunner.query(
      `CREATE TABLE "treaty_states" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "state_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_treaty_states" PRIMARY KEY ("id")
      )`,
    );

    // 37. treaty_state_carriers
    await queryRunner.query(
      `CREATE TABLE "treaty_state_carriers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "state_id" uuid NOT NULL,
        "carrier_id" uuid NOT NULL,
        "pct" numeric(6,2),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_treaty_state_carriers" PRIMARY KEY ("id")
      )`,
    );

    // 38. treaty_mgas
    await queryRunner.query(
      `CREATE TABLE "treaty_mgas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "mga_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_treaty_mgas" PRIMARY KEY ("id")
      )`,
    );

    // 39. treaty_reinsurers
    await queryRunner.query(
      `CREATE TABLE "treaty_reinsurers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "reinsurer_id" uuid NOT NULL,
        "quota_share" numeric(6,2) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_treaty_reinsurers" PRIMARY KEY ("id")
      )`,
    );

    // 40. treaty_sequence_prefixes
    await queryRunner.query(
      `CREATE TABLE "treaty_sequence_prefixes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "sequence_prefix_id" uuid NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_treaty_sequence_prefixes" PRIMARY KEY ("id")
      )`,
    );

    // 41. treaty_itd_totals
    await queryRunner.query(
      `CREATE TABLE "treaty_itd_totals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
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
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_treaty_itd_totals" PRIMARY KEY ("id")
      )`,
    );

    // -------------------- GROUP 4: Workbook --------------------

    // 42. workbooks
    await queryRunner.query(
      `CREATE TABLE "workbooks" (
        "id" SERIAL NOT NULL,
        "program" character varying NOT NULL,
        "monthKey" character varying NOT NULL,
        "monthLabel" character varying NOT NULL,
        "source" character varying NOT NULL DEFAULT 'FUT',
        "rates" jsonb,
        "mga" character varying NOT NULL DEFAULT '1201',
        "lob" character varying NOT NULL DEFAULT '000171',
        "lineDescSuffix" character varying NOT NULL DEFAULT '',
        "comp" character varying NOT NULL DEFAULT '100',
        "cc" character varying NOT NULL DEFAULT '000',
        "ext" character varying NOT NULL DEFAULT '0000',
        "sub" character varying NOT NULL DEFAULT '',
        "status" character varying NOT NULL DEFAULT 'Pending',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "deletedBy" uuid,
        CONSTRAINT "PK_workbooks" PRIMARY KEY ("id")
      )`,
    );

    // 43. state_exhibits
    await queryRunner.query(
      `CREATE TABLE "state_exhibits" (
        "id" SERIAL NOT NULL,
        "workbookId" integer NOT NULL,
        "stateCode" character varying NOT NULL,
        "pw" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "pfw" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "pc" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "pfc" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "tax" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "lp" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "laep" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "ae_paid" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "pe" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "pfe" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "uep" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "lu" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "laeu" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "aeu" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "loss_reserves" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "lae_reserves_dcc" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "lae_reserves_aoe" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "loss_ibnr" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "lae_ibnr_dcc" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "lae_ibnr_aoe" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "ulae_ibnr" numeric(15,2)[] NOT NULL DEFAULT '{0,0,0}',
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "deletedBy" uuid,
        CONSTRAINT "PK_state_exhibits" PRIMARY KEY ("id")
      )`,
    );

    // -------------------- GROUP 5: Accounting / GL --------------------

    // 44. chart_of_accounts
    await queryRunner.query(
      `CREATE TABLE "chart_of_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "account_code" integer NOT NULL,
        "key" character varying,
        "description" character varying NOT NULL,
        "parent_id" uuid,
        "is_parent" boolean NOT NULL DEFAULT false,
        "normal_balance" character varying,
        "next_number" integer,
        "earning_account_id" uuid,
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_chart_of_accounts_account_code" UNIQUE ("account_code"),
        CONSTRAINT "UQ_chart_of_accounts_key" UNIQUE ("key"),
        CONSTRAINT "PK_chart_of_accounts" PRIMARY KEY ("id")
      )`,
    );

    // 45. chart_of_account_documents
    await queryRunner.query(
      `CREATE TABLE "chart_of_account_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coa_id" uuid NOT NULL,
        "document_type_id" uuid NOT NULL,
        "file_name" character varying NOT NULL,
        "file_url" character varying NOT NULL,
        "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
        "uploaded_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_chart_of_account_documents" PRIMARY KEY ("id")
      )`,
    );

    // 46. gl_mappings
    await queryRunner.query(
      `CREATE TABLE "gl_mappings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coa_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_gl_mappings_type" UNIQUE ("type"),
        CONSTRAINT "PK_gl_mappings" PRIMARY KEY ("id")
      )`,
    );

    // 47. journal_entry_batches
    await queryRunner.query(
      `CREATE TABLE "journal_entry_batches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "batch_number" character varying NOT NULL,
        "treaty_id" uuid,
        "workbook_id" integer,
        "period" character varying NOT NULL,
        "agent_name" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending_review',
        "total_amount" numeric(15,2) NOT NULL DEFAULT 0,
        "count" integer NOT NULL DEFAULT 0,
        "approved_at" TIMESTAMP,
        "approved_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "UQ_journal_entry_batches_batch_number" UNIQUE ("batch_number"),
        CONSTRAINT "PK_journal_entry_batches" PRIMARY KEY ("id")
      )`,
    );

    // 48. journal_entry_drafts
    await queryRunner.query(
      `CREATE TABLE "journal_entry_drafts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "batch_id" uuid NOT NULL,
        "je_number" integer NOT NULL,
        "description" character varying NOT NULL,
        "coa_id" uuid NOT NULL,
        "state_id" uuid,
        "product_id" uuid,
        "sub" character varying,
        "debit" numeric(15,2) NOT NULL DEFAULT 0,
        "credit" numeric(15,2) NOT NULL DEFAULT 0,
        "date" date NOT NULL,
        "dp" character varying,
        "policy" character varying,
        "memo" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "updated_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_journal_entry_drafts" PRIMARY KEY ("id")
      )`,
    );

    // 49. journal_entries
    await queryRunner.query(
      `CREATE TABLE "journal_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "batch_id" uuid NOT NULL,
        "je_number" integer NOT NULL,
        "description" character varying NOT NULL,
        "coa_id" uuid NOT NULL,
        "state_id" uuid,
        "product_id" uuid,
        "sub" character varying,
        "debit" numeric(15,2),
        "credit" numeric(15,2),
        "date" date NOT NULL,
        "dp" character varying,
        "policy" character varying,
        "memo" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_journal_entries" PRIMARY KEY ("id")
      )`,
    );

    // 50. calculation_report_lines
    await queryRunner.query(
      `CREATE TABLE "calculation_report_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "batch_id" uuid NOT NULL,
        "state_id" uuid,
        "is_total" boolean NOT NULL DEFAULT false,
        "coa_id" uuid NOT NULL,
        "line_item" character varying NOT NULL,
        "amount" numeric(15,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_calculation_report_lines" PRIMARY KEY ("id")
      )`,
    );

    // 51. cash_settlements
    await queryRunner.query(
      `CREATE TABLE "cash_settlements" (
        "id" SERIAL NOT NULL,
        "workbookId" integer,
        "batch_id" uuid NOT NULL,
        "reinsurer_id" uuid NOT NULL,
        "begBal" numeric(15,2) NOT NULL DEFAULT 0,
        "netDueAmount" numeric(15,2) NOT NULL DEFAULT 0,
        "amtPaid" numeric(15,2) NOT NULL DEFAULT 0,
        "endBal" numeric(15,2) NOT NULL DEFAULT 0,
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "deletedBy" uuid,
        CONSTRAINT "PK_cash_settlements" PRIMARY KEY ("id")
      )`,
    );

    // ===================================================================
    // CREATE INDEXES (non-unique)
    // ===================================================================

    // --- users ---
    await queryRunner.query(`CREATE INDEX "IDX_users_role_id" ON "users" ("role_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_status" ON "users" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_is_deleted" ON "users" ("is_deleted")`);

    // --- submodules ---
    await queryRunner.query(
      `CREATE INDEX "IDX_submodules_module_id" ON "submodules" ("module_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_submodules_is_deleted" ON "submodules" ("is_deleted")`,
    );

    // --- user_sessions ---
    await queryRunner.query(
      `CREATE INDEX "IDX_user_sessions_user_id" ON "user_sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_sessions_is_deleted" ON "user_sessions" ("is_deleted")`,
    );

    // --- login_otps ---
    await queryRunner.query(
      `CREATE INDEX "IDX_login_otps_is_deleted" ON "login_otps" ("is_deleted")`,
    );

    // --- pending_invites ---
    await queryRunner.query(
      `CREATE INDEX "IDX_pending_invites_is_deleted" ON "pending_invites" ("is_deleted")`,
    );

    // --- role_permissions ---
    await queryRunner.query(
      `CREATE INDEX "IDX_role_permissions_is_deleted" ON "role_permissions" ("is_deleted")`,
    );

    // --- user_permissions ---
    await queryRunner.query(
      `CREATE INDEX "IDX_user_permissions_user_id" ON "user_permissions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_permissions_module_id" ON "user_permissions" ("module_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_permissions_submodule_id" ON "user_permissions" ("submodule_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_permissions_permission_id" ON "user_permissions" ("permission_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_permissions_is_deleted" ON "user_permissions" ("is_deleted")`,
    );

    // --- login_challenges ---
    await queryRunner.query(
      `CREATE INDEX "IDX_login_challenges_is_deleted" ON "login_challenges" ("is_deleted")`,
    );

    // --- activity_logs ---
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_user_id" ON "activity_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_module_id" ON "activity_logs" ("module_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_submodule_id" ON "activity_logs" ("submodule_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_action" ON "activity_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_created_at" ON "activity_logs" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_is_deleted" ON "activity_logs" ("is_deleted")`,
    );

    // --- document_type_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_document_type_master_is_active" ON "document_type_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_document_type_master_is_deleted" ON "document_type_master" ("is_deleted")`,
    );

    // --- contact_domain_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_contact_domain_master_is_active" ON "contact_domain_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contact_domain_master_is_deleted" ON "contact_domain_master" ("is_deleted")`,
    );

    // --- state_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_state_master_is_active" ON "state_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_state_master_is_deleted" ON "state_master" ("is_deleted")`,
    );

    // --- mga_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_mga_master_is_active" ON "mga_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mga_master_is_deleted" ON "mga_master" ("is_deleted")`,
    );

    // --- carriers ---
    await queryRunner.query(`CREATE INDEX "IDX_carriers_is_active" ON "carriers" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_carriers_is_deleted" ON "carriers" ("is_deleted")`);

    // --- reinsurer_companies ---
    await queryRunner.query(
      `CREATE INDEX "IDX_reinsurer_companies_is_active" ON "reinsurer_companies" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reinsurer_companies_is_deleted" ON "reinsurer_companies" ("is_deleted")`,
    );

    // --- broker_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_broker_master_is_active" ON "broker_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_broker_master_is_deleted" ON "broker_master" ("is_deleted")`,
    );

    // --- lines_of_business ---
    await queryRunner.query(
      `CREATE INDEX "IDX_lines_of_business_is_active" ON "lines_of_business" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lines_of_business_is_deleted" ON "lines_of_business" ("is_deleted")`,
    );

    // --- cob_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_cob_master_is_active" ON "cob_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cob_master_is_deleted" ON "cob_master" ("is_deleted")`,
    );

    // --- product_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_product_master_is_active" ON "product_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_master_is_deleted" ON "product_master" ("is_deleted")`,
    );

    // --- sequence_prefix_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_sequence_prefix_master_is_active" ON "sequence_prefix_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sequence_prefix_master_is_deleted" ON "sequence_prefix_master" ("is_deleted")`,
    );

    // --- state_documents ---
    await queryRunner.query(
      `CREATE INDEX "IDX_state_documents_state_id" ON "state_documents" ("state_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_state_documents_is_deleted" ON "state_documents" ("is_deleted")`,
    );

    // --- mga_other_names ---
    await queryRunner.query(
      `CREATE INDEX "IDX_mga_other_names_mga_id" ON "mga_other_names" ("mga_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mga_other_names_is_deleted" ON "mga_other_names" ("is_deleted")`,
    );

    // --- mga_documents ---
    await queryRunner.query(
      `CREATE INDEX "IDX_mga_documents_mga_id" ON "mga_documents" ("mga_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mga_documents_is_deleted" ON "mga_documents" ("is_deleted")`,
    );

    // --- mga_contact_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_mga_contact_master_mga_id" ON "mga_contact_master" ("mga_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mga_contact_master_is_active" ON "mga_contact_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mga_contact_master_is_deleted" ON "mga_contact_master" ("is_deleted")`,
    );

    // --- carrier_documents ---
    await queryRunner.query(
      `CREATE INDEX "IDX_carrier_documents_carrier_id" ON "carrier_documents" ("carrier_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_carrier_documents_document_type_id" ON "carrier_documents" ("document_type_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_carrier_documents_is_deleted" ON "carrier_documents" ("is_deleted")`,
    );

    // --- broker_documents ---
    await queryRunner.query(
      `CREATE INDEX "IDX_broker_documents_broker_id" ON "broker_documents" ("broker_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_broker_documents_document_type_id" ON "broker_documents" ("document_type_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_broker_documents_is_deleted" ON "broker_documents" ("is_deleted")`,
    );

    // --- product_lobs ---
    await queryRunner.query(
      `CREATE INDEX "IDX_product_lobs_product_id" ON "product_lobs" ("product_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_product_lobs_lob_id" ON "product_lobs" ("lob_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_product_lobs_is_deleted" ON "product_lobs" ("is_deleted")`,
    );

    // --- product_cobs ---
    await queryRunner.query(
      `CREATE INDEX "IDX_product_cobs_product_id" ON "product_cobs" ("product_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_product_cobs_cob_id" ON "product_cobs" ("cob_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_product_cobs_is_deleted" ON "product_cobs" ("is_deleted")`,
    );

    // --- locked_periods ---
    await queryRunner.query(
      `CREATE INDEX "IDX_locked_periods_is_locked" ON "locked_periods" ("is_locked")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_locked_periods_locked_by" ON "locked_periods" ("locked_by")`,
    );

    // --- treaty_type_master ---
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_type_master_is_active" ON "treaty_type_master" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_type_master_is_deleted" ON "treaty_type_master" ("is_deleted")`,
    );

    // --- treaties ---
    await queryRunner.query(`CREATE INDEX "IDX_treaties_mga_id" ON "treaties" ("mga_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_treaties_risk_company_id" ON "treaties" ("risk_company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaties_treaty_type_id" ON "treaties" ("treaty_type_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_treaties_is_deleted" ON "treaties" ("is_deleted")`);

    // --- treaty_products ---
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_products_treaty_id" ON "treaty_products" ("treaty_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_products_product_id" ON "treaty_products" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_products_is_deleted" ON "treaty_products" ("is_deleted")`,
    );

    // --- treaty_states ---
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_states_treaty_id" ON "treaty_states" ("treaty_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_states_state_id" ON "treaty_states" ("state_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_states_is_deleted" ON "treaty_states" ("is_deleted")`,
    );

    // --- treaty_state_carriers ---
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_state_carriers_treaty_id" ON "treaty_state_carriers" ("treaty_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_state_carriers_state_id" ON "treaty_state_carriers" ("state_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_state_carriers_carrier_id" ON "treaty_state_carriers" ("carrier_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_state_carriers_is_deleted" ON "treaty_state_carriers" ("is_deleted")`,
    );

    // --- treaty_mgas ---
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_mgas_treaty_id" ON "treaty_mgas" ("treaty_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_treaty_mgas_mga_id" ON "treaty_mgas" ("mga_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_mgas_is_deleted" ON "treaty_mgas" ("is_deleted")`,
    );

    // --- treaty_reinsurers ---
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_reinsurers_treaty_id" ON "treaty_reinsurers" ("treaty_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_reinsurers_reinsurer_id" ON "treaty_reinsurers" ("reinsurer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_reinsurers_is_deleted" ON "treaty_reinsurers" ("is_deleted")`,
    );

    // --- treaty_sequence_prefixes ---
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_sequence_prefixes_treaty_id" ON "treaty_sequence_prefixes" ("treaty_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_sequence_prefixes_sequence_prefix_id" ON "treaty_sequence_prefixes" ("sequence_prefix_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_sequence_prefixes_is_deleted" ON "treaty_sequence_prefixes" ("is_deleted")`,
    );

    // --- treaty_itd_totals ---
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_itd_totals_treaty_id" ON "treaty_itd_totals" ("treaty_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_itd_totals_year" ON "treaty_itd_totals" ("year")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_itd_totals_month" ON "treaty_itd_totals" ("month")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_itd_totals_state_id" ON "treaty_itd_totals" ("state_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_treaty_itd_totals_is_deleted" ON "treaty_itd_totals" ("is_deleted")`,
    );

    // --- workbooks ---
    await queryRunner.query(`CREATE INDEX "IDX_workbooks_monthKey" ON "workbooks" ("monthKey")`);
    await queryRunner.query(`CREATE INDEX "IDX_workbooks_status" ON "workbooks" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_workbooks_isDeleted" ON "workbooks" ("isDeleted")`);

    // --- state_exhibits ---
    await queryRunner.query(
      `CREATE INDEX "IDX_state_exhibits_workbookId" ON "state_exhibits" ("workbookId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_state_exhibits_stateCode" ON "state_exhibits" ("stateCode")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_state_exhibits_isDeleted" ON "state_exhibits" ("isDeleted")`,
    );

    // --- chart_of_accounts ---
    await queryRunner.query(
      `CREATE INDEX "IDX_chart_of_accounts_parent_id" ON "chart_of_accounts" ("parent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chart_of_accounts_earning_account_id" ON "chart_of_accounts" ("earning_account_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chart_of_accounts_is_active" ON "chart_of_accounts" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chart_of_accounts_is_deleted" ON "chart_of_accounts" ("is_deleted")`,
    );

    // --- chart_of_account_documents ---
    await queryRunner.query(
      `CREATE INDEX "IDX_chart_of_account_documents_coa_id" ON "chart_of_account_documents" ("coa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chart_of_account_documents_is_deleted" ON "chart_of_account_documents" ("is_deleted")`,
    );

    // --- gl_mappings ---
    await queryRunner.query(`CREATE INDEX "IDX_gl_mappings_coa_id" ON "gl_mappings" ("coa_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_gl_mappings_is_deleted" ON "gl_mappings" ("is_deleted")`,
    );

    // --- journal_entry_batches ---
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entry_batches_period" ON "journal_entry_batches" ("period")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entry_batches_treaty_id" ON "journal_entry_batches" ("treaty_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entry_batches_workbook_id" ON "journal_entry_batches" ("workbook_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entry_batches_status" ON "journal_entry_batches" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entry_batches_is_deleted" ON "journal_entry_batches" ("is_deleted")`,
    );

    // --- journal_entry_drafts ---
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entry_drafts_batch_id" ON "journal_entry_drafts" ("batch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entry_drafts_coa_id" ON "journal_entry_drafts" ("coa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entry_drafts_is_deleted" ON "journal_entry_drafts" ("is_deleted")`,
    );

    // --- journal_entries ---
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entries_batch_id" ON "journal_entries" ("batch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entries_coa_id" ON "journal_entries" ("coa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entries_state_id" ON "journal_entries" ("state_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entries_product_id" ON "journal_entries" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entries_date" ON "journal_entries" ("date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_entries_is_deleted" ON "journal_entries" ("is_deleted")`,
    );

    // --- calculation_report_lines ---
    await queryRunner.query(
      `CREATE INDEX "IDX_calculation_report_lines_batch_id" ON "calculation_report_lines" ("batch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_calculation_report_lines_coa_id" ON "calculation_report_lines" ("coa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_calculation_report_lines_is_deleted" ON "calculation_report_lines" ("is_deleted")`,
    );

    // --- cash_settlements ---
    await queryRunner.query(
      `CREATE INDEX "IDX_cash_settlements_batch_id" ON "cash_settlements" ("batch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cash_settlements_reinsurer_id" ON "cash_settlements" ("reinsurer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cash_settlements_isDeleted" ON "cash_settlements" ("isDeleted")`,
    );

    // ===================================================================
    // UNIQUE CONSTRAINTS (composite unique indexes)
    // ===================================================================

    // product_lobs (product_id, lob_id)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_product_lobs_product_id_lob_id" ON "product_lobs" ("product_id", "lob_id") WHERE "is_deleted" = false`,
    );

    // product_cobs (product_id, cob_id)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_product_cobs_product_id_cob_id" ON "product_cobs" ("product_id", "cob_id") WHERE "is_deleted" = false`,
    );

    // treaty_products (treaty_id, product_id)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_treaty_products_treaty_id_product_id" ON "treaty_products" ("treaty_id", "product_id") WHERE "is_deleted" = false`,
    );

    // treaty_states (treaty_id, state_id)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_treaty_states_treaty_id_state_id" ON "treaty_states" ("treaty_id", "state_id") WHERE "is_deleted" = false`,
    );

    // treaty_state_carriers (treaty_id, state_id, carrier_id)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_treaty_state_carriers_unique" ON "treaty_state_carriers" ("treaty_id", "state_id", "carrier_id") WHERE "is_deleted" = false`,
    );

    // treaty_mgas (treaty_id, mga_id)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_treaty_mgas_treaty_id_mga_id" ON "treaty_mgas" ("treaty_id", "mga_id") WHERE "is_deleted" = false`,
    );

    // treaty_sequence_prefixes (treaty_id, sequence_prefix_id)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_treaty_sequence_prefixes_unique" ON "treaty_sequence_prefixes" ("treaty_id", "sequence_prefix_id") WHERE "is_deleted" = false`,
    );

    // treaty_itd_totals (treaty_id, year, month, state_id)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_treaty_itd_totals_unique" ON "treaty_itd_totals" ("treaty_id", "year", "month", "state_id") WHERE "is_deleted" = false`,
    );

    // cash_settlements (batch_id, reinsurer_id)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cash_settlements_batch_id_reinsurer_id" ON "cash_settlements" ("batch_id", "reinsurer_id") WHERE "isDeleted" = false`,
    );

    // ===================================================================
    // FOREIGN KEY CONSTRAINTS
    // ===================================================================

    // --- Auth / RBAC FKs ---
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "submodules" ADD CONSTRAINT "FK_submodules_module_id" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_user_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_invites" ADD CONSTRAINT "FK_pending_invites_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_invites" ADD CONSTRAINT "FK_pending_invites_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_module_id" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_submodule_id" FOREIGN KEY ("submodule_id") REFERENCES "submodules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_user_permissions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_user_permissions_module_id" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_user_permissions_submodule_id" FOREIGN KEY ("submodule_id") REFERENCES "submodules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_user_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_challenges" ADD CONSTRAINT "FK_login_challenges_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_challenges" ADD CONSTRAINT "FK_login_challenges_existing_session_id" FOREIGN KEY ("existing_session_id") REFERENCES "user_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_activity_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_activity_logs_module_id" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_activity_logs_submodule_id" FOREIGN KEY ("submodule_id") REFERENCES "submodules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // --- Masters FKs ---
    await queryRunner.query(
      `ALTER TABLE "state_documents" ADD CONSTRAINT "FK_state_documents_state_id" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_documents" ADD CONSTRAINT "FK_state_documents_document_type_id" FOREIGN KEY ("document_type_id") REFERENCES "document_type_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_other_names" ADD CONSTRAINT "FK_mga_other_names_mga_id" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_other_names" ADD CONSTRAINT "FK_mga_other_names_state_id" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_documents" ADD CONSTRAINT "FK_mga_documents_mga_id" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_documents" ADD CONSTRAINT "FK_mga_documents_document_type_id" FOREIGN KEY ("document_type_id") REFERENCES "document_type_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_contact_master" ADD CONSTRAINT "FK_mga_contact_master_mga_id" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_contact_master" ADD CONSTRAINT "FK_mga_contact_master_domain_id" FOREIGN KEY ("domain_id") REFERENCES "contact_domain_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carrier_documents" ADD CONSTRAINT "FK_carrier_documents_carrier_id" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carrier_documents" ADD CONSTRAINT "FK_carrier_documents_document_type_id" FOREIGN KEY ("document_type_id") REFERENCES "document_type_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "broker_documents" ADD CONSTRAINT "FK_broker_documents_broker_id" FOREIGN KEY ("broker_id") REFERENCES "broker_master"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "broker_documents" ADD CONSTRAINT "FK_broker_documents_document_type_id" FOREIGN KEY ("document_type_id") REFERENCES "document_type_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_lobs" ADD CONSTRAINT "FK_product_lobs_product_id" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_lobs" ADD CONSTRAINT "FK_product_lobs_lob_id" FOREIGN KEY ("lob_id") REFERENCES "lines_of_business"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_cobs" ADD CONSTRAINT "FK_product_cobs_product_id" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_cobs" ADD CONSTRAINT "FK_product_cobs_cob_id" FOREIGN KEY ("cob_id") REFERENCES "cob_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "locked_periods" ADD CONSTRAINT "FK_locked_periods_locked_by" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // --- Treaty FKs ---
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD CONSTRAINT "FK_treaties_treaty_type_id" FOREIGN KEY ("treaty_type_id") REFERENCES "treaty_type_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD CONSTRAINT "FK_treaties_mga_id" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD CONSTRAINT "FK_treaties_risk_company_id" FOREIGN KEY ("risk_company_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_products" ADD CONSTRAINT "FK_treaty_products_treaty_id" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_products" ADD CONSTRAINT "FK_treaty_products_product_id" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_states" ADD CONSTRAINT "FK_treaty_states_treaty_id" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_states" ADD CONSTRAINT "FK_treaty_states_state_id" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" ADD CONSTRAINT "FK_treaty_state_carriers_treaty_id" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" ADD CONSTRAINT "FK_treaty_state_carriers_state_id" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" ADD CONSTRAINT "FK_treaty_state_carriers_carrier_id" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_mgas" ADD CONSTRAINT "FK_treaty_mgas_treaty_id" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_mgas" ADD CONSTRAINT "FK_treaty_mgas_mga_id" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_treaty_reinsurers_treaty_id" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_treaty_reinsurers_reinsurer_id" FOREIGN KEY ("reinsurer_id") REFERENCES "reinsurer_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_sequence_prefixes" ADD CONSTRAINT "FK_treaty_sequence_prefixes_treaty_id" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_sequence_prefixes" ADD CONSTRAINT "FK_treaty_sequence_prefixes_sequence_prefix_id" FOREIGN KEY ("sequence_prefix_id") REFERENCES "sequence_prefix_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_itd_totals" ADD CONSTRAINT "FK_treaty_itd_totals_treaty_id" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_itd_totals" ADD CONSTRAINT "FK_treaty_itd_totals_state_id" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    // --- Workbook FKs ---
    await queryRunner.query(
      `ALTER TABLE "state_exhibits" ADD CONSTRAINT "FK_state_exhibits_workbookId" FOREIGN KEY ("workbookId") REFERENCES "workbooks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // --- Accounting / GL FKs ---
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_chart_of_accounts_parent_id" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_chart_of_accounts_earning_account_id" FOREIGN KEY ("earning_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_chart_of_accounts_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_chart_of_accounts_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" ADD CONSTRAINT "FK_chart_of_account_documents_coa_id" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" ADD CONSTRAINT "FK_chart_of_account_documents_document_type_id" FOREIGN KEY ("document_type_id") REFERENCES "document_type_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" ADD CONSTRAINT "FK_chart_of_account_documents_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gl_mappings" ADD CONSTRAINT "FK_gl_mappings_coa_id" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_batches" ADD CONSTRAINT "FK_journal_entry_batches_treaty_id" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_batches" ADD CONSTRAINT "FK_journal_entry_batches_workbook_id" FOREIGN KEY ("workbook_id") REFERENCES "workbooks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_drafts" ADD CONSTRAINT "FK_journal_entry_drafts_batch_id" FOREIGN KEY ("batch_id") REFERENCES "journal_entry_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_drafts" ADD CONSTRAINT "FK_journal_entry_drafts_coa_id" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_drafts" ADD CONSTRAINT "FK_journal_entry_drafts_state_id" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_drafts" ADD CONSTRAINT "FK_journal_entry_drafts_product_id" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_journal_entries_batch_id" FOREIGN KEY ("batch_id") REFERENCES "journal_entry_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_journal_entries_coa_id" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_journal_entries_state_id" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_journal_entries_product_id" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calculation_report_lines" ADD CONSTRAINT "FK_calculation_report_lines_batch_id" FOREIGN KEY ("batch_id") REFERENCES "journal_entry_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calculation_report_lines" ADD CONSTRAINT "FK_calculation_report_lines_state_id" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calculation_report_lines" ADD CONSTRAINT "FK_calculation_report_lines_coa_id" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_settlements" ADD CONSTRAINT "FK_cash_settlements_workbookId" FOREIGN KEY ("workbookId") REFERENCES "workbooks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_settlements" ADD CONSTRAINT "FK_cash_settlements_batch_id" FOREIGN KEY ("batch_id") REFERENCES "journal_entry_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_settlements" ADD CONSTRAINT "FK_cash_settlements_reinsurer_id" FOREIGN KEY ("reinsurer_id") REFERENCES "reinsurer_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ===================================================================
    // DROP FOREIGN KEYS (reverse order of creation)
    // ===================================================================

    await queryRunner.query(
      `ALTER TABLE "cash_settlements" DROP CONSTRAINT IF EXISTS "FK_cash_settlements_reinsurer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_settlements" DROP CONSTRAINT IF EXISTS "FK_cash_settlements_batch_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_settlements" DROP CONSTRAINT IF EXISTS "FK_cash_settlements_workbookId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calculation_report_lines" DROP CONSTRAINT IF EXISTS "FK_calculation_report_lines_coa_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calculation_report_lines" DROP CONSTRAINT IF EXISTS "FK_calculation_report_lines_state_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calculation_report_lines" DROP CONSTRAINT IF EXISTS "FK_calculation_report_lines_batch_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" DROP CONSTRAINT IF EXISTS "FK_journal_entries_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" DROP CONSTRAINT IF EXISTS "FK_journal_entries_state_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" DROP CONSTRAINT IF EXISTS "FK_journal_entries_coa_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" DROP CONSTRAINT IF EXISTS "FK_journal_entries_batch_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_drafts" DROP CONSTRAINT IF EXISTS "FK_journal_entry_drafts_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_drafts" DROP CONSTRAINT IF EXISTS "FK_journal_entry_drafts_state_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_drafts" DROP CONSTRAINT IF EXISTS "FK_journal_entry_drafts_coa_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_drafts" DROP CONSTRAINT IF EXISTS "FK_journal_entry_drafts_batch_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_batches" DROP CONSTRAINT IF EXISTS "FK_journal_entry_batches_workbook_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry_batches" DROP CONSTRAINT IF EXISTS "FK_journal_entry_batches_treaty_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gl_mappings" DROP CONSTRAINT IF EXISTS "FK_gl_mappings_coa_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" DROP CONSTRAINT IF EXISTS "FK_chart_of_account_documents_uploaded_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" DROP CONSTRAINT IF EXISTS "FK_chart_of_account_documents_document_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" DROP CONSTRAINT IF EXISTS "FK_chart_of_account_documents_coa_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT IF EXISTS "FK_chart_of_accounts_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT IF EXISTS "FK_chart_of_accounts_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT IF EXISTS "FK_chart_of_accounts_earning_account_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT IF EXISTS "FK_chart_of_accounts_parent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_exhibits" DROP CONSTRAINT IF EXISTS "FK_state_exhibits_workbookId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_itd_totals" DROP CONSTRAINT IF EXISTS "FK_treaty_itd_totals_state_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_itd_totals" DROP CONSTRAINT IF EXISTS "FK_treaty_itd_totals_treaty_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_sequence_prefixes" DROP CONSTRAINT IF EXISTS "FK_treaty_sequence_prefixes_sequence_prefix_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_sequence_prefixes" DROP CONSTRAINT IF EXISTS "FK_treaty_sequence_prefixes_treaty_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT IF EXISTS "FK_treaty_reinsurers_reinsurer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT IF EXISTS "FK_treaty_reinsurers_treaty_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_mgas" DROP CONSTRAINT IF EXISTS "FK_treaty_mgas_mga_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_mgas" DROP CONSTRAINT IF EXISTS "FK_treaty_mgas_treaty_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" DROP CONSTRAINT IF EXISTS "FK_treaty_state_carriers_carrier_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" DROP CONSTRAINT IF EXISTS "FK_treaty_state_carriers_state_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" DROP CONSTRAINT IF EXISTS "FK_treaty_state_carriers_treaty_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_states" DROP CONSTRAINT IF EXISTS "FK_treaty_states_state_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_states" DROP CONSTRAINT IF EXISTS "FK_treaty_states_treaty_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_products" DROP CONSTRAINT IF EXISTS "FK_treaty_products_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_products" DROP CONSTRAINT IF EXISTS "FK_treaty_products_treaty_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" DROP CONSTRAINT IF EXISTS "FK_treaties_risk_company_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" DROP CONSTRAINT IF EXISTS "FK_treaties_mga_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" DROP CONSTRAINT IF EXISTS "FK_treaties_treaty_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "locked_periods" DROP CONSTRAINT IF EXISTS "FK_locked_periods_locked_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_cobs" DROP CONSTRAINT IF EXISTS "FK_product_cobs_cob_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_cobs" DROP CONSTRAINT IF EXISTS "FK_product_cobs_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_lobs" DROP CONSTRAINT IF EXISTS "FK_product_lobs_lob_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_lobs" DROP CONSTRAINT IF EXISTS "FK_product_lobs_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "broker_documents" DROP CONSTRAINT IF EXISTS "FK_broker_documents_document_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "broker_documents" DROP CONSTRAINT IF EXISTS "FK_broker_documents_broker_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carrier_documents" DROP CONSTRAINT IF EXISTS "FK_carrier_documents_document_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carrier_documents" DROP CONSTRAINT IF EXISTS "FK_carrier_documents_carrier_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_contact_master" DROP CONSTRAINT IF EXISTS "FK_mga_contact_master_domain_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_contact_master" DROP CONSTRAINT IF EXISTS "FK_mga_contact_master_mga_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_documents" DROP CONSTRAINT IF EXISTS "FK_mga_documents_document_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_documents" DROP CONSTRAINT IF EXISTS "FK_mga_documents_mga_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_other_names" DROP CONSTRAINT IF EXISTS "FK_mga_other_names_state_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mga_other_names" DROP CONSTRAINT IF EXISTS "FK_mga_other_names_mga_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_documents" DROP CONSTRAINT IF EXISTS "FK_state_documents_document_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_documents" DROP CONSTRAINT IF EXISTS "FK_state_documents_state_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "FK_activity_logs_submodule_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "FK_activity_logs_module_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "FK_activity_logs_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_challenges" DROP CONSTRAINT IF EXISTS "FK_login_challenges_existing_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_challenges" DROP CONSTRAINT IF EXISTS "FK_login_challenges_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "FK_user_permissions_permission_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "FK_user_permissions_submodule_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "FK_user_permissions_module_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "FK_user_permissions_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_role_permissions_permission_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_role_permissions_submodule_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_role_permissions_module_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_role_permissions_role_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_invites" DROP CONSTRAINT IF EXISTS "FK_pending_invites_invited_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_invites" DROP CONSTRAINT IF EXISTS "FK_pending_invites_role_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "FK_user_sessions_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submodules" DROP CONSTRAINT IF EXISTS "FK_submodules_module_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_role_id"`);

    // ===================================================================
    // DROP ALL TABLES
    // ===================================================================

    await queryRunner.query(`DROP TABLE IF EXISTS "cash_settlements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "calculation_report_lines" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_entries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_entry_drafts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_entry_batches" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gl_mappings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chart_of_account_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chart_of_accounts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "state_exhibits" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workbooks" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_itd_totals" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_sequence_prefixes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_reinsurers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_mgas" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_state_carriers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_states" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaties" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_type_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carrier_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mga_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mga_contact_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mga_other_names" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "state_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_cobs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_lobs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sequence_prefix_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_type_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_domain_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "locked_periods" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "state_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cob_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lines_of_business" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reinsurer_companies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carriers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mga_master" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "login_challenges" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pending_invites" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "login_otps" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "submodules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "modules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_lob_cobs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treaty_lobs" CASCADE`);
  }
}
