import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1783223589374 implements MigrationInterface {
  name = 'InitialSchema1783223589374';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "state_exhibits" ("id" SERIAL NOT NULL, "workbookId" integer NOT NULL, "stateCode" character varying NOT NULL, "pw" numeric array NOT NULL DEFAULT '{0,0,0}', "pfw" numeric array NOT NULL DEFAULT '{0,0,0}', "pc" numeric array NOT NULL DEFAULT '{0,0,0}', "pfc" numeric array NOT NULL DEFAULT '{0,0,0}', "tax" numeric array NOT NULL DEFAULT '{0,0,0}', "lp" numeric array NOT NULL DEFAULT '{0,0,0}', "laep" numeric array NOT NULL DEFAULT '{0,0,0}', "ae_paid" numeric array NOT NULL DEFAULT '{0,0,0}', "pe" numeric array NOT NULL DEFAULT '{0,0,0}', "pfe" numeric array NOT NULL DEFAULT '{0,0,0}', "uep" numeric array NOT NULL DEFAULT '{0,0,0}', "lu" numeric array NOT NULL DEFAULT '{0,0,0}', "laeu" numeric array NOT NULL DEFAULT '{0,0,0}', "aeu" numeric array NOT NULL DEFAULT '{0,0,0}', "loss_reserves" numeric array NOT NULL DEFAULT '{0,0,0}', "lae_reserves_dcc" numeric array NOT NULL DEFAULT '{0,0,0}', "lae_reserves_aoe" numeric array NOT NULL DEFAULT '{0,0,0}', "loss_ibnr" numeric array NOT NULL DEFAULT '{0,0,0}', "lae_ibnr_dcc" numeric array NOT NULL DEFAULT '{0,0,0}', "lae_ibnr_aoe" numeric array NOT NULL DEFAULT '{0,0,0}', "ulae_ibnr" numeric array NOT NULL DEFAULT '{0,0,0}', "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "deletedBy" uuid, CONSTRAINT "PK_787577d99d3cc3c4fd8c4aff41a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cash_settlements" ("id" SERIAL NOT NULL, "workbookId" integer NOT NULL, "batch_id" uuid, "reinsurer_id" uuid, "begBal" numeric(15,2) NOT NULL DEFAULT '0', "netDueAmount" numeric(15,2) NOT NULL DEFAULT '0', "amtPaid" numeric(15,2) NOT NULL DEFAULT '0', "endBal" numeric(15,2) NOT NULL DEFAULT '0', "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "deletedBy" uuid, CONSTRAINT "REL_9d1e38ce8b1df37c28147e8969" UNIQUE ("workbookId"), CONSTRAINT "PK_cee5a5ba5d8f2f9488aa5743cbc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workbooks" ("id" SERIAL NOT NULL, "program" character varying NOT NULL, "monthKey" character varying NOT NULL, "monthLabel" character varying NOT NULL, "source" character varying NOT NULL DEFAULT 'FUT', "rates" jsonb, "mga" character varying NOT NULL DEFAULT '1201', "lob" character varying NOT NULL DEFAULT '000171', "lineDescSuffix" character varying NOT NULL DEFAULT '', "comp" character varying NOT NULL DEFAULT '100', "cc" character varying NOT NULL DEFAULT '000', "ext" character varying NOT NULL DEFAULT '0000', "sub" character varying NOT NULL DEFAULT '', "status" character varying NOT NULL DEFAULT 'Pending', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "deletedBy" uuid, CONSTRAINT "PK_984f720e2c516b1e34a2f2705b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "label" character varying NOT NULL, "color" character varying(7), "description" text, "is_system" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "role_id" uuid NOT NULL, "user_type" character varying NOT NULL, "user_entity_type" character varying, "user_entity_id" uuid, "name" character varying NOT NULL, "initials" character varying(4), "avatar_color" character varying(7), "phone" character varying, "department" character varying, "title" character varying, "status" character varying NOT NULL DEFAULT 'active', "password_hash" character varying, "joined_date" date, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "is_superadmin" boolean NOT NULL DEFAULT false, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "submodules" ("id" character varying NOT NULL, "module_id" character varying NOT NULL, "label" character varying NOT NULL, CONSTRAINT "PK_d7d162953eb3a9b55581ded1aa2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "modules" ("id" character varying NOT NULL, "label" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, CONSTRAINT "PK_7dbefd488bd96c5bf31f0ce0c95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying NOT NULL, "label" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_1c1e0637ecf1f6401beb9a68abe" UNIQUE ("action"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "module_id" character varying NOT NULL, "submodule_id" character varying, "permission_id" uuid NOT NULL, "access_type" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "PK_01f4295968ba33d73926684264f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pending_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying NOT NULL, "role_id" uuid, "user_type" character varying, "department" character varying, "title" character varying, "user_entity_type" character varying, "user_entity_id" uuid, "invited_by" uuid, "invited_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP NOT NULL, "token" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', CONSTRAINT "UQ_c96ae2d932382d87390c159179c" UNIQUE ("token"), CONSTRAINT "PK_f0d37a7f8b0ca2b4d2150681622" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role_id" uuid NOT NULL, "module_id" character varying NOT NULL, "submodule_id" character varying, "permission_id" uuid NOT NULL, CONSTRAINT "UQ_09fa7016b39ac4bd967f8b7939e" UNIQUE ("role_id", "module_id", "submodule_id", "permission_id"), CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "calculation_report_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid, "line_number" integer NOT NULL, "line_label" character varying NOT NULL, "formula_expression" text, "is_bold" boolean NOT NULL DEFAULT false, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_b45ad772e29550431fe9173e7a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mga_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mga_code" character varying NOT NULL, "name" character varying NOT NULL, "tax_payable_inhouse" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "ledger_amount" numeric(15,2) NOT NULL DEFAULT '0', "company_id" bigint, "id_name" character varying, "address" character varying, "zip" character varying, "city" character varying, "state" character varying, "phone" character varying, "open_item" boolean NOT NULL DEFAULT false, "op_start_date" date, "other_names" jsonb, "naics_code" character varying, "contact_name" character varying, "contact_email" character varying, "contact_phone" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_cc82e29a0e762b0c566c85454b0" UNIQUE ("mga_code"), CONSTRAINT "PK_49cf55aaf914e2d84dac54464ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reinsurer_companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reinsurer_company_id" character varying NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_8df33cd02d4986b67d3d68e0b39" UNIQUE ("reinsurer_company_id"), CONSTRAINT "PK_4ca47c44cfd59008b93f8533521" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "carriers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "risk_company_id" character varying NOT NULL, "company_id" bigint, "id_name" character varying, "name" character varying NOT NULL, "phone" character varying, "is_admitted" boolean NOT NULL DEFAULT true, "state" character varying, "address" character varying, "zip" character varying, "city" character varying, "notes" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "UQ_abb19ad25878b97cf1a8612546b" UNIQUE ("risk_company_id"), CONSTRAINT "UQ_3da0e4f08921a08c48cf3a83e67" UNIQUE ("company_id"), CONSTRAINT "PK_fe886e72b3d9f67da3ce70f4368" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lines_of_business" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lob_code" character varying NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "description" character varying, "type" character varying, "taxable" boolean NOT NULL DEFAULT false, "priority" integer NOT NULL DEFAULT '1', "fully_earned" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_a1d3d50c9d1d0f5177fe6e8d300" UNIQUE ("lob_code"), CONSTRAINT "PK_747b6031056ffa01b8f8b1c765e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cob_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cob_code" character varying NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "description" character varying, "type" character varying, "taxable" boolean NOT NULL DEFAULT false, "priority" integer NOT NULL DEFAULT '1', "fully_earned" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_60bfd74bd243c6ec3f2369b5d79" UNIQUE ("cob_code"), CONSTRAINT "PK_3120048c8c2cfd2dd987f1a26a9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_lob_cobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_lob_id" uuid NOT NULL, "cob_id" uuid NOT NULL, CONSTRAINT "PK_3f828ef8d91026f8fa941198d5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_lobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "lob_id" uuid NOT NULL, CONSTRAINT "PK_bcc6f779b216b67bbf6cfffb315" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "state_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "state_code" integer, "state_abbr" character varying NOT NULL, "name" character varying NOT NULL, "notes" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_b25bb0bc3910330facd0ca586a2" UNIQUE ("state_code"), CONSTRAINT "UQ_dd271114f35f72be39d6500a135" UNIQUE ("state_abbr"), CONSTRAINT "PK_1216026d3fd7e624ba3d8ad6f60" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_states" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "state_id" uuid NOT NULL, CONSTRAINT "PK_4979298dbe7c9ebdc96b6afb535" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_mgas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "mga_id" uuid NOT NULL, CONSTRAINT "PK_4d75d2316837f83f535ee3f3db3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "broker_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "broker_code" character varying NOT NULL, "name" character varying NOT NULL, "contact_name" character varying, "contact_email" character varying, "contact_phone" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "UQ_0955be4867a43535876bf7bc410" UNIQUE ("broker_code"), CONSTRAINT "PK_56450169c27055b99a76f7b31dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_state_carriers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "risk_company_id" uuid NOT NULL, "retention_pct" numeric(6,2), "state_id" uuid, "broker_id" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_41d5022b7f7a30e42301265454f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_reinsurers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "reinsurer_id" uuid NOT NULL, "cession_pct" numeric(6,2) NOT NULL, "state_id" uuid, "broker_id" uuid, CONSTRAINT "PK_70c5b13fd5cb244c54a626d9b27" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_code" character varying NOT NULL, "name" character varying NOT NULL, "mga_id" uuid, "reinsurer_id" uuid, "risk_company_id" uuid, "effective_date" date, "expiration_date" date, "qs_pct" numeric(6,2), "cf_pct" numeric(6,2), "comm_pct" numeric(6,2), "bb_pct" numeric(6,2), "ulae_pct" numeric(6,2), "xol_pct" numeric(6,2), "lr_cap_pct" numeric(6,2), "ibnr_pct" numeric(6,2), "lae_dcc_pct" numeric(6,2), "lae_aoe_pct" numeric(6,2), "carrier_retention_pct" numeric(6,2), "reinsurer_cession_pct" numeric(6,2), "treaty_type" character varying NOT NULL DEFAULT 'Quota Share', "ulae_type" character varying NOT NULL DEFAULT 'percentage', "ulae_basis" character varying, "ulae_flat_amount" numeric(15,2), "policy_seq_prefix" character varying, "policy_seq_start" integer, "policy_seq_next" integer, "claim_seq_prefix" character varying, "claim_seq_start" integer, "claim_seq_next" integer, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_58655f68d7fb9d2004e44e3a518" UNIQUE ("treaty_code"), CONSTRAINT "PK_f494c12014ca2f8362b05d44eb0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_type_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type_code" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "UQ_92c11cffcdeedf223ce34419ab2" UNIQUE ("type_code"), CONSTRAINT "PK_4441947d898f58ca1b72b36368f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_sequence_prefixes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "sequence_prefix_id" uuid NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_658eabcbc476bfed492162e002a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "product_id" uuid NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_cf83a3f54c4ed600e5850dc24fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "treaty_itd_totals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "year" integer NOT NULL, "month" integer NOT NULL, "state_id" uuid NOT NULL, "pw" numeric(15,2) NOT NULL DEFAULT '0', "pfw" numeric(15,2) NOT NULL DEFAULT '0', "pc" numeric(15,2) NOT NULL DEFAULT '0', "pfc" numeric(15,2) NOT NULL DEFAULT '0', "tax" numeric(15,2) NOT NULL DEFAULT '0', "lp" numeric(15,2) NOT NULL DEFAULT '0', "laep" numeric(15,2) NOT NULL DEFAULT '0', "ae_paid" numeric(15,2) NOT NULL DEFAULT '0', "pe" numeric(15,2) NOT NULL DEFAULT '0', "pfe" numeric(15,2) NOT NULL DEFAULT '0', "uep" numeric(15,2) NOT NULL DEFAULT '0', "lu" numeric(15,2) NOT NULL DEFAULT '0', "laeu" numeric(15,2) NOT NULL DEFAULT '0', "aeu" numeric(15,2) NOT NULL DEFAULT '0', "loss_reserves" numeric(15,2) NOT NULL DEFAULT '0', "lae_reserves_dcc" numeric(15,2) NOT NULL DEFAULT '0', "lae_reserves_aoe" numeric(15,2) NOT NULL DEFAULT '0', "loss_ibnr" numeric(15,2) NOT NULL DEFAULT '0', "lae_ibnr_dcc" numeric(15,2) NOT NULL DEFAULT '0', "lae_ibnr_aoe" numeric(15,2) NOT NULL DEFAULT '0', "ulae_ibnr" numeric(15,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_b389bb03fa9f5860fb23a34526e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "state_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "state_id" uuid NOT NULL, "file_name" character varying NOT NULL, "file_url" character varying NOT NULL, "document_type" character varying, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" uuid, CONSTRAINT "PK_d269c931f3f2b3cb024cd7606eb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sequence_prefix_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying, "name" character varying NOT NULL, "prefix" character varying, "next_value" integer NOT NULL DEFAULT '1', "padding_width" integer NOT NULL DEFAULT '4', "description" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "UQ_64e4a4fd4a95687036c7ee33ef1" UNIQUE ("code"), CONSTRAINT "PK_0e200021ef6dce50eea748ca90b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "carrier_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "risk_company_id" uuid NOT NULL, "file_name" character varying NOT NULL, "file_url" character varying NOT NULL, "document_type" character varying, "document_type_id" uuid, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_7081696bf11ad039a072b6d1e62" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" character varying NOT NULL, "lob_id" uuid, "cob_id" uuid, "name" character varying NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "UQ_c91a860e2497176139ca5b4aeb4" UNIQUE ("product_id"), CONSTRAINT "PK_1966e0275e801d4d8a11f3fd6ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_lobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "lob_id" uuid NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_67ad0031de607606c0c91e466ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_cobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "cob_id" uuid NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_0022b32318d65cc42ca8cdc433f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mga_other_names" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mga_id" uuid NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_8387160475e5f775f34e08f585f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mga_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mga_id" uuid NOT NULL, "file_name" character varying NOT NULL, "file_url" character varying NOT NULL, "document_type" character varying, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" uuid, CONSTRAINT "PK_31f8cf5350f1c36e3ff7c4f2f5d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mga_contact_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mga_id" uuid NOT NULL, "contact_name" character varying NOT NULL, "contact_email" character varying, "contact_phone" character varying, "is_primary" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_6f27f166ddefb2de5e43826b328" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "locked_periods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "period" character varying NOT NULL, "is_locked" boolean NOT NULL DEFAULT true, "locked_at" TIMESTAMP NOT NULL DEFAULT now(), "locked_by" uuid, CONSTRAINT "UQ_2f849456a61ef08873eb4b8a175" UNIQUE ("period"), CONSTRAINT "PK_eced5d87cf0fdfd7b238055c640" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_type_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "UQ_a85d95a665cfb968bb022dd4ec7" UNIQUE ("code"), CONSTRAINT "PK_1508ec6d3f214ee39a37df3a288" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "broker_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "broker_id" uuid NOT NULL, "file_name" character varying NOT NULL, "file_url" character varying NOT NULL, "document_type_id" uuid, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_53f252226367b32757d07f776ee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "journal_entry_batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "batch_number" character varying NOT NULL, "period" character varying NOT NULL, "agent_name" character varying NOT NULL, "treaty_id" uuid, "month_key" character varying, "workbook_id" integer, "state_code" character varying, "status" character varying NOT NULL DEFAULT 'posted', "total_amount" numeric(15,2) NOT NULL DEFAULT '0', "count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "UQ_d33ea4e02f81d297625004ad21d" UNIQUE ("batch_number"), CONSTRAINT "PK_ebebd1ddfc69a1c8d338e15baea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chart_of_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_code" integer NOT NULL, "key" character varying, "description" character varying NOT NULL, "parent_id" uuid, "is_parent" boolean NOT NULL DEFAULT false, "normal_balance" character varying, "next_number" integer, "earning_account_id" uuid, "notes" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_1e09dc9479d5cac85e1a5bf9f8b" UNIQUE ("account_code"), CONSTRAINT "UQ_1089483440d41befc1ae214ddbe" UNIQUE ("key"), CONSTRAINT "PK_467c08a2efc78393c647da32bac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "journal_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "batch_id" uuid NOT NULL, "je_number" integer NOT NULL, "description" character varying NOT NULL, "coa_id" uuid NOT NULL, "sub" character varying, "debit" numeric(15,2), "credit" numeric(15,2), "date" date NOT NULL, "dp" character varying, "policy" character varying, "memo" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_a70368e64230434457c8d007ab3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "journal_entry_drafts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "batch_id" uuid NOT NULL, "account_code" character varying NOT NULL, "account_name" character varying NOT NULL, "description" text, "debit" numeric(15,2) NOT NULL DEFAULT '0', "credit" numeric(15,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_44cba5ef0c35aceb6c59e5de9de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contact_domain_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mga_id" uuid NOT NULL, "domain_name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "PK_36d65e2d8c695d6d316ad6c1ba5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "gl_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coa_id" uuid NOT NULL, "type" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_e0acd1a4ac49af4dc7e82ca358f" UNIQUE ("type"), CONSTRAINT "PK_880af11599a977b299cedba86aa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chart_of_account_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coa_id" uuid NOT NULL, "file_name" character varying NOT NULL, "file_url" character varying NOT NULL, "document_type" character varying, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" uuid, CONSTRAINT "PK_c46db3590e3cee5292ebc5179d3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "session_token" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "device_label" character varying, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP NOT NULL, "revoked_at" TIMESTAMP, "revoke_reason" character varying, CONSTRAINT "UQ_e5eb7a3c7766f941fe16b9edecb" UNIQUE ("session_token"), CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "login_otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "otp_hash" character varying NOT NULL, "attempt_count" integer NOT NULL DEFAULT '0', "is_used" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_aa3070eb5efc1c7a8e815ead21f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "login_challenges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "challenge_token" character varying NOT NULL, "existing_session_id" uuid, "new_device_label" character varying, "new_ip_address" character varying, "new_user_agent" character varying, "status" character varying NOT NULL DEFAULT 'pending', "expires_at" TIMESTAMP NOT NULL, "resolved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7104b5ceecdf6a5ec84524d4475" UNIQUE ("challenge_token"), CONSTRAINT "PK_85b9467d340eb112cb0fa7a0cde" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "activity_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "module_id" character varying, "submodule_id" character varying, "action" character varying NOT NULL, "entity_type" character varying, "entity_id" character varying, "description" text, "changes" jsonb, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_exhibits" ADD CONSTRAINT "FK_1cbdddc932e472bfacf5eb59b8b" FOREIGN KEY ("workbookId") REFERENCES "workbooks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_settlements" ADD CONSTRAINT "FK_9d1e38ce8b1df37c28147e8969a" FOREIGN KEY ("workbookId") REFERENCES "workbooks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "submodules" ADD CONSTRAINT "FK_e5bc8076b0e21fe38db8ababf2d" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_8ab0433089f0b41a0f8e5b10d16" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_b987cb1236bbe09f8f448ee059b" FOREIGN KEY ("submodule_id") REFERENCES "submodules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_8145f5fadacd311693c15e41f10" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_invites" ADD CONSTRAINT "FK_0168a0792f920a6f68840dfe52b" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_invites" ADD CONSTRAINT "FK_02a32b95bac5fb94366ea0451bb" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_2e0c5c1b40a4137a80930b3b65e" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_52e8c9ecd30630cbb3191a01d7a" FOREIGN KEY ("submodule_id") REFERENCES "submodules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_lob_cobs" ADD CONSTRAINT "FK_339070276ba9fe90b2728146bed" FOREIGN KEY ("treaty_lob_id") REFERENCES "treaty_lobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_lob_cobs" ADD CONSTRAINT "FK_35b5ca41780bb232da4e52840c3" FOREIGN KEY ("cob_id") REFERENCES "cob_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_lobs" ADD CONSTRAINT "FK_77c8a64b1afad267e5d4df13588" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_lobs" ADD CONSTRAINT "FK_c5cc81eb0a8d7c72c36013590a4" FOREIGN KEY ("lob_id") REFERENCES "lines_of_business"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_states" ADD CONSTRAINT "FK_0d6d5497e0a578007348788c2af" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_states" ADD CONSTRAINT "FK_9e730192bcedd292def00db3508" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_mgas" ADD CONSTRAINT "FK_9bedd08208ec57db492d0f40040" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_mgas" ADD CONSTRAINT "FK_61cbb5d34914c8e8ed97ce1aa83" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" ADD CONSTRAINT "FK_2e34e3987ef45da0f55edf494a9" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" ADD CONSTRAINT "FK_7eea07b0b57b75e2a7a00e22135" FOREIGN KEY ("risk_company_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" ADD CONSTRAINT "FK_aa2313934b90a8858d6ac196173" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" ADD CONSTRAINT "FK_062775d98e5080bf4d2d5cab68f" FOREIGN KEY ("broker_id") REFERENCES "broker_master"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_45d0b4ac835a933c29e2cf54692" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_89cc1d82dbab33eb68c7f395040" FOREIGN KEY ("reinsurer_id") REFERENCES "reinsurer_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_57a7e88bcd24145391ca38d3e90" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_38f27e51ca25957a46ed905a982" FOREIGN KEY ("broker_id") REFERENCES "broker_master"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD CONSTRAINT "FK_f7c94d27a65f232ff88ffb470f4" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD CONSTRAINT "FK_227ea000eb9c328e64cc79fc809" FOREIGN KEY ("reinsurer_id") REFERENCES "reinsurer_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD CONSTRAINT "FK_0cb77ced5a092aa8f5e4377e110" FOREIGN KEY ("risk_company_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_master" ADD CONSTRAINT "FK_7155d70022733f235f7295d7200" FOREIGN KEY ("lob_id") REFERENCES "lines_of_business"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_master" ADD CONSTRAINT "FK_fd254674561c941338f3d1615b0" FOREIGN KEY ("cob_id") REFERENCES "cob_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "locked_periods" ADD CONSTRAINT "FK_cdd6f47bd9c3e881078015e081e" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_233c2a470511f11b1564bb6cd1e" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_2421e464a281cc019534ddd563f" FOREIGN KEY ("earning_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_a1cc819efca4907a7d7c15731ec" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_b6a884435be11ae0abc05d3aa36" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_5e5d46369ee0b9de3a24c23bb97" FOREIGN KEY ("batch_id") REFERENCES "journal_entry_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_c23b37139aba44dd3730e7c88cf" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gl_mappings" ADD CONSTRAINT "FK_0eb6769f0bb0799ffe4704222d2" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" ADD CONSTRAINT "FK_9fb23c3b101c6dad9df11dff983" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" ADD CONSTRAINT "FK_c2fbb0e1cada125c500594824f9" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_challenges" ADD CONSTRAINT "FK_23bb9553efaa83910672d214f65" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_challenges" ADD CONSTRAINT "FK_81d9d551e28e9750d2200ab5144" FOREIGN KEY ("existing_session_id") REFERENCES "user_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_d54f841fa5478e4734590d44036" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_b38bdabb0ea236c2836a79c4d1c" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_fb6adcbf1da4881b2a2a86ba414" FOREIGN KEY ("submodule_id") REFERENCES "submodules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_fb6adcbf1da4881b2a2a86ba414"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_b38bdabb0ea236c2836a79c4d1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_d54f841fa5478e4734590d44036"`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_challenges" DROP CONSTRAINT "FK_81d9d551e28e9750d2200ab5144"`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_challenges" DROP CONSTRAINT "FK_23bb9553efaa83910672d214f65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" DROP CONSTRAINT "FK_c2fbb0e1cada125c500594824f9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" DROP CONSTRAINT "FK_9fb23c3b101c6dad9df11dff983"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gl_mappings" DROP CONSTRAINT "FK_0eb6769f0bb0799ffe4704222d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" DROP CONSTRAINT "FK_c23b37139aba44dd3730e7c88cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" DROP CONSTRAINT "FK_5e5d46369ee0b9de3a24c23bb97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT "FK_b6a884435be11ae0abc05d3aa36"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT "FK_a1cc819efca4907a7d7c15731ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT "FK_2421e464a281cc019534ddd563f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT "FK_233c2a470511f11b1564bb6cd1e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "locked_periods" DROP CONSTRAINT "FK_cdd6f47bd9c3e881078015e081e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_master" DROP CONSTRAINT "FK_fd254674561c941338f3d1615b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_master" DROP CONSTRAINT "FK_7155d70022733f235f7295d7200"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" DROP CONSTRAINT "FK_0cb77ced5a092aa8f5e4377e110"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" DROP CONSTRAINT "FK_227ea000eb9c328e64cc79fc809"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" DROP CONSTRAINT "FK_f7c94d27a65f232ff88ffb470f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_38f27e51ca25957a46ed905a982"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_57a7e88bcd24145391ca38d3e90"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_89cc1d82dbab33eb68c7f395040"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_45d0b4ac835a933c29e2cf54692"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" DROP CONSTRAINT "FK_062775d98e5080bf4d2d5cab68f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" DROP CONSTRAINT "FK_aa2313934b90a8858d6ac196173"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" DROP CONSTRAINT "FK_7eea07b0b57b75e2a7a00e22135"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" DROP CONSTRAINT "FK_2e34e3987ef45da0f55edf494a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_mgas" DROP CONSTRAINT "FK_61cbb5d34914c8e8ed97ce1aa83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_mgas" DROP CONSTRAINT "FK_9bedd08208ec57db492d0f40040"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_states" DROP CONSTRAINT "FK_9e730192bcedd292def00db3508"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_states" DROP CONSTRAINT "FK_0d6d5497e0a578007348788c2af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_lobs" DROP CONSTRAINT "FK_c5cc81eb0a8d7c72c36013590a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_lobs" DROP CONSTRAINT "FK_77c8a64b1afad267e5d4df13588"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_lob_cobs" DROP CONSTRAINT "FK_35b5ca41780bb232da4e52840c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_lob_cobs" DROP CONSTRAINT "FK_339070276ba9fe90b2728146bed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_52e8c9ecd30630cbb3191a01d7a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_2e0c5c1b40a4137a80930b3b65e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_invites" DROP CONSTRAINT "FK_02a32b95bac5fb94366ea0451bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_invites" DROP CONSTRAINT "FK_0168a0792f920a6f68840dfe52b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_8145f5fadacd311693c15e41f10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_b987cb1236bbe09f8f448ee059b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_8ab0433089f0b41a0f8e5b10d16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submodules" DROP CONSTRAINT "FK_e5bc8076b0e21fe38db8ababf2d"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
    await queryRunner.query(
      `ALTER TABLE "cash_settlements" DROP CONSTRAINT "FK_9d1e38ce8b1df37c28147e8969a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "state_exhibits" DROP CONSTRAINT "FK_1cbdddc932e472bfacf5eb59b8b"`,
    );
    await queryRunner.query(`DROP TABLE "activity_logs"`);
    await queryRunner.query(`DROP TABLE "login_challenges"`);
    await queryRunner.query(`DROP TABLE "login_otps"`);
    await queryRunner.query(`DROP TABLE "user_sessions"`);
    await queryRunner.query(`DROP TABLE "chart_of_account_documents"`);
    await queryRunner.query(`DROP TABLE "gl_mappings"`);
    await queryRunner.query(`DROP TABLE "contact_domain_master"`);
    await queryRunner.query(`DROP TABLE "journal_entry_drafts"`);
    await queryRunner.query(`DROP TABLE "journal_entries"`);
    await queryRunner.query(`DROP TABLE "chart_of_accounts"`);
    await queryRunner.query(`DROP TABLE "journal_entry_batches"`);
    await queryRunner.query(`DROP TABLE "broker_documents"`);
    await queryRunner.query(`DROP TABLE "document_type_master"`);
    await queryRunner.query(`DROP TABLE "locked_periods"`);
    await queryRunner.query(`DROP TABLE "mga_contact_master"`);
    await queryRunner.query(`DROP TABLE "mga_documents"`);
    await queryRunner.query(`DROP TABLE "mga_other_names"`);
    await queryRunner.query(`DROP TABLE "product_cobs"`);
    await queryRunner.query(`DROP TABLE "product_lobs"`);
    await queryRunner.query(`DROP TABLE "product_master"`);
    await queryRunner.query(`DROP TABLE "carrier_documents"`);
    await queryRunner.query(`DROP TABLE "sequence_prefix_master"`);
    await queryRunner.query(`DROP TABLE "state_documents"`);
    await queryRunner.query(`DROP TABLE "treaty_itd_totals"`);
    await queryRunner.query(`DROP TABLE "treaty_products"`);
    await queryRunner.query(`DROP TABLE "treaty_sequence_prefixes"`);
    await queryRunner.query(`DROP TABLE "treaty_type_master"`);
    await queryRunner.query(`DROP TABLE "treaties"`);
    await queryRunner.query(`DROP TABLE "treaty_reinsurers"`);
    await queryRunner.query(`DROP TABLE "treaty_state_carriers"`);
    await queryRunner.query(`DROP TABLE "broker_master"`);
    await queryRunner.query(`DROP TABLE "treaty_mgas"`);
    await queryRunner.query(`DROP TABLE "treaty_states"`);
    await queryRunner.query(`DROP TABLE "state_master"`);
    await queryRunner.query(`DROP TABLE "treaty_lobs"`);
    await queryRunner.query(`DROP TABLE "treaty_lob_cobs"`);
    await queryRunner.query(`DROP TABLE "cob_master"`);
    await queryRunner.query(`DROP TABLE "lines_of_business"`);
    await queryRunner.query(`DROP TABLE "carriers"`);
    await queryRunner.query(`DROP TABLE "reinsurer_companies"`);
    await queryRunner.query(`DROP TABLE "mga_master"`);
    await queryRunner.query(`DROP TABLE "calculation_report_lines"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "pending_invites"`);
    await queryRunner.query(`DROP TABLE "user_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "modules"`);
    await queryRunner.query(`DROP TABLE "submodules"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "workbooks"`);
    await queryRunner.query(`DROP TABLE "cash_settlements"`);
    await queryRunner.query(`DROP TABLE "state_exhibits"`);
  }
}
