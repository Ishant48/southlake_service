import { MigrationInterface, QueryRunner } from "typeorm";

export class ReinsuranceEnhancements1783000000000 implements MigrationInterface {
    name = 'ReinsuranceEnhancements1783000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create brokers table
        await queryRunner.query(`
            CREATE TABLE "brokers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "broker_code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "contact_name" character varying,
                "contact_email" character varying,
                "contact_phone" character varying,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now(),
                CONSTRAINT "UQ_brokers_broker_code" UNIQUE ("broker_code"),
                CONSTRAINT "PK_brokers" PRIMARY KEY ("id")
            )
        `);

        // 2. Create products table
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" character varying NOT NULL,
                "lob_id" uuid NOT NULL,
                "cob_id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now(),
                CONSTRAINT "UQ_products_product_id" UNIQUE ("product_id"),
                CONSTRAINT "PK_products" PRIMARY KEY ("id"),
                CONSTRAINT "FK_products_lob" FOREIGN KEY ("lob_id") REFERENCES "lines_of_business"("id") ON DELETE RESTRICT,
                CONSTRAINT "FK_products_cob" FOREIGN KEY ("cob_id") REFERENCES "cob_master"("id") ON DELETE RESTRICT
            )
        `);

        // 3. Create locked_periods table
        await queryRunner.query(`
            CREATE TABLE "locked_periods" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "period" character varying NOT NULL,
                "is_locked" boolean NOT NULL DEFAULT true,
                "locked_at" TIMESTAMP NOT NULL DEFAULT now(),
                "locked_by" uuid,
                CONSTRAINT "UQ_locked_periods_period" UNIQUE ("period"),
                CONSTRAINT "PK_locked_periods" PRIMARY KEY ("id"),
                CONSTRAINT "FK_locked_periods_user" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // 4. Update mga_master table
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "naics_code" character varying`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "contact_name" character varying`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "contact_email" character varying`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "contact_phone" character varying`);

        // 5. Update documents tables
        await queryRunner.query(`ALTER TABLE "mga_documents" ADD "document_type" character varying`);
        await queryRunner.query(`ALTER TABLE "state_documents" ADD "document_type" character varying`);
        await queryRunner.query(`ALTER TABLE "risk_company_documents" ADD "document_type" character varying`);
        await queryRunner.query(`ALTER TABLE "chart_of_account_documents" ADD "document_type" character varying`);

        // 6. Update treaties table
        await queryRunner.query(`ALTER TABLE "treaties" ADD "treaty_type" character varying NOT NULL DEFAULT 'Quota Share'`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "ulae_type" character varying NOT NULL DEFAULT 'percentage'`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "ulae_basis" character varying`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "ulae_flat_amount" decimal(15,2)`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "policy_seq_prefix" character varying`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "policy_seq_start" integer`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "policy_seq_next" integer`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "claim_seq_prefix" character varying`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "claim_seq_start" integer`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "claim_seq_next" integer`);

        // 7. Update treaty_carriers & treaty_reinsurers tables
        await queryRunner.query(`ALTER TABLE "treaty_carriers" ADD "state_id" uuid`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" ADD CONSTRAINT "FK_treaty_carriers_state" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" ADD "broker_id" uuid`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" ADD CONSTRAINT "FK_treaty_carriers_broker" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE SET NULL`);

        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" ADD "state_id" uuid`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_treaty_reinsurers_state" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" ADD "broker_id" uuid`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_treaty_reinsurers_broker" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_treaty_reinsurers_broker"`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_treaty_reinsurers_state"`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP COLUMN "broker_id"`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP COLUMN "state_id"`);

        await queryRunner.query(`ALTER TABLE "treaty_carriers" DROP CONSTRAINT "FK_treaty_carriers_broker"`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" DROP CONSTRAINT "FK_treaty_carriers_state"`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" DROP COLUMN "broker_id"`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" DROP COLUMN "state_id"`);

        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "claim_seq_next"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "claim_seq_start"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "claim_seq_prefix"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "policy_seq_next"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "policy_seq_start"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "policy_seq_prefix"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "ulae_flat_amount"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "ulae_basis"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "ulae_type"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "treaty_type"`);

        await queryRunner.query(`ALTER TABLE "chart_of_account_documents" DROP COLUMN "document_type"`);
        await queryRunner.query(`ALTER TABLE "risk_company_documents" DROP COLUMN "document_type"`);
        await queryRunner.query(`ALTER TABLE "state_documents" DROP COLUMN "document_type"`);
        await queryRunner.query(`ALTER TABLE "mga_documents" DROP COLUMN "document_type"`);

        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "contact_phone"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "contact_email"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "contact_name"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "naics_code"`);

        await queryRunner.query(`DROP TABLE "locked_periods"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "brokers"`);
    }
}
