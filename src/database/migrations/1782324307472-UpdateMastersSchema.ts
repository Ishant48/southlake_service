import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMastersSchema1782324307472 implements MigrationInterface {
    name = 'UpdateMastersSchema1782324307472'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "state_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "state_id" uuid NOT NULL, "file_name" character varying NOT NULL, "file_url" character varying NOT NULL, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" uuid, CONSTRAINT "PK_d269c931f3f2b3cb024cd7606eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "risk_company_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "risk_company_id" uuid NOT NULL, "file_name" character varying NOT NULL, "file_url" character varying NOT NULL, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" uuid, CONSTRAINT "PK_28354085928b324c24f4800ea2e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "ledger_amount" numeric(15,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD "company_id" bigint`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD CONSTRAINT "UQ_e8b8ddd330888d3e93409217971" UNIQUE ("company_id")`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD "id_name" character varying`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD "is_admitted" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "state_master" ADD "state_abbr" character varying`);
        await queryRunner.query(`UPDATE "state_master" SET "state_abbr" = "state_code"`);
        await queryRunner.query(`ALTER TABLE "state_master" ALTER COLUMN "state_abbr" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "state_master" ADD CONSTRAINT "UQ_dd271114f35f72be39d6500a135" UNIQUE ("state_abbr")`);
        await queryRunner.query(`ALTER TABLE "state_master" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "state_master" DROP CONSTRAINT "UQ_b25bb0bc3910330facd0ca586a2"`);
        await queryRunner.query(`ALTER TABLE "state_master" DROP COLUMN "state_code"`);
        await queryRunner.query(`ALTER TABLE "state_master" ADD "state_code" integer`);
        await queryRunner.query(`ALTER TABLE "state_master" ADD CONSTRAINT "UQ_b25bb0bc3910330facd0ca586a2" UNIQUE ("state_code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "state_master" DROP CONSTRAINT "UQ_b25bb0bc3910330facd0ca586a2"`);
        await queryRunner.query(`ALTER TABLE "state_master" DROP COLUMN "state_code"`);
        await queryRunner.query(`ALTER TABLE "state_master" ADD "state_code" character varying(2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "state_master" ADD CONSTRAINT "UQ_b25bb0bc3910330facd0ca586a2" UNIQUE ("state_code")`);
        await queryRunner.query(`ALTER TABLE "state_master" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "state_master" DROP CONSTRAINT "UQ_dd271114f35f72be39d6500a135"`);
        await queryRunner.query(`ALTER TABLE "state_master" DROP COLUMN "state_abbr"`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP COLUMN "is_admitted"`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP COLUMN "id_name"`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP CONSTRAINT "UQ_e8b8ddd330888d3e93409217971"`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP COLUMN "company_id"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "ledger_amount"`);
        await queryRunner.query(`DROP TABLE "risk_company_documents"`);
        await queryRunner.query(`DROP TABLE "state_documents"`);
    }

}
