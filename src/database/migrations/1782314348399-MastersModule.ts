import { MigrationInterface, QueryRunner } from "typeorm";

export class MastersModule1782314348399 implements MigrationInterface {
    name = 'MastersModule1782314348399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mga_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mga_code" character varying NOT NULL, "name" character varying NOT NULL, "tax_payable_inhouse" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_cc82e29a0e762b0c566c85454b0" UNIQUE ("mga_code"), CONSTRAINT "PK_49cf55aaf914e2d84dac54464ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reinsurer_companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reinsurer_company_id" character varying NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_8df33cd02d4986b67d3d68e0b39" UNIQUE ("reinsurer_company_id"), CONSTRAINT "PK_4ca47c44cfd59008b93f8533521" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "risk_companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "risk_company_id" character varying NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_7899161ace15a4c71028790ed1e" UNIQUE ("risk_company_id"), CONSTRAINT "PK_eda7f78cda6f44a6f14d7574353" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lines_of_business" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lob_code" character varying NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_a1d3d50c9d1d0f5177fe6e8d300" UNIQUE ("lob_code"), CONSTRAINT "PK_747b6031056ffa01b8f8b1c765e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cob_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cob_code" character varying NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_60bfd74bd243c6ec3f2369b5d79" UNIQUE ("cob_code"), CONSTRAINT "PK_3120048c8c2cfd2dd987f1a26a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "treaty_lob_cobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_lob_id" uuid NOT NULL, "cob_id" uuid NOT NULL, CONSTRAINT "PK_3f828ef8d91026f8fa941198d5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "treaty_lobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "lob_id" uuid NOT NULL, CONSTRAINT "PK_bcc6f779b216b67bbf6cfffb315" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "state_master" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "state_code" character varying(2) NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_b25bb0bc3910330facd0ca586a2" UNIQUE ("state_code"), CONSTRAINT "PK_1216026d3fd7e624ba3d8ad6f60" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "treaty_states" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "state_id" uuid NOT NULL, CONSTRAINT "PK_4979298dbe7c9ebdc96b6afb535" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "treaties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_code" character varying NOT NULL, "name" character varying NOT NULL, "mga_id" uuid NOT NULL, "reinsurer_id" uuid, "risk_company_id" uuid, "effective_date" date, "expiration_date" date, "qs_pct" numeric(6,2), "cf_pct" numeric(6,2), "comm_pct" numeric(6,2), "bb_pct" numeric(6,2), "ulae_pct" numeric(6,2), "xol_pct" numeric(6,2), "lr_cap_pct" numeric(6,2), "ibnr_pct" numeric(6,2), "carrier_retention_pct" numeric(6,2), "reinsurer_cession_pct" numeric(6,2), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_58655f68d7fb9d2004e44e3a518" UNIQUE ("treaty_code"), CONSTRAINT "PK_f494c12014ca2f8362b05d44eb0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "mga_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mga_id" uuid NOT NULL, "file_name" character varying NOT NULL, "file_url" character varying NOT NULL, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" uuid, CONSTRAINT "PK_31f8cf5350f1c36e3ff7c4f2f5d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "treaty_lob_cobs" ADD CONSTRAINT "FK_339070276ba9fe90b2728146bed" FOREIGN KEY ("treaty_lob_id") REFERENCES "treaty_lobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_lob_cobs" ADD CONSTRAINT "FK_35b5ca41780bb232da4e52840c3" FOREIGN KEY ("cob_id") REFERENCES "cob_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_lobs" ADD CONSTRAINT "FK_77c8a64b1afad267e5d4df13588" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_lobs" ADD CONSTRAINT "FK_c5cc81eb0a8d7c72c36013590a4" FOREIGN KEY ("lob_id") REFERENCES "lines_of_business"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_states" ADD CONSTRAINT "FK_0d6d5497e0a578007348788c2af" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_states" ADD CONSTRAINT "FK_9e730192bcedd292def00db3508" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD CONSTRAINT "FK_f7c94d27a65f232ff88ffb470f4" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD CONSTRAINT "FK_227ea000eb9c328e64cc79fc809" FOREIGN KEY ("reinsurer_id") REFERENCES "reinsurer_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD CONSTRAINT "FK_0cb77ced5a092aa8f5e4377e110" FOREIGN KEY ("risk_company_id") REFERENCES "risk_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treaties" DROP CONSTRAINT "FK_0cb77ced5a092aa8f5e4377e110"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP CONSTRAINT "FK_227ea000eb9c328e64cc79fc809"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP CONSTRAINT "FK_f7c94d27a65f232ff88ffb470f4"`);
        await queryRunner.query(`ALTER TABLE "treaty_states" DROP CONSTRAINT "FK_9e730192bcedd292def00db3508"`);
        await queryRunner.query(`ALTER TABLE "treaty_states" DROP CONSTRAINT "FK_0d6d5497e0a578007348788c2af"`);
        await queryRunner.query(`ALTER TABLE "treaty_lobs" DROP CONSTRAINT "FK_c5cc81eb0a8d7c72c36013590a4"`);
        await queryRunner.query(`ALTER TABLE "treaty_lobs" DROP CONSTRAINT "FK_77c8a64b1afad267e5d4df13588"`);
        await queryRunner.query(`ALTER TABLE "treaty_lob_cobs" DROP CONSTRAINT "FK_35b5ca41780bb232da4e52840c3"`);
        await queryRunner.query(`ALTER TABLE "treaty_lob_cobs" DROP CONSTRAINT "FK_339070276ba9fe90b2728146bed"`);
        await queryRunner.query(`DROP TABLE "mga_documents"`);
        await queryRunner.query(`DROP TABLE "treaties"`);
        await queryRunner.query(`DROP TABLE "treaty_states"`);
        await queryRunner.query(`DROP TABLE "state_master"`);
        await queryRunner.query(`DROP TABLE "treaty_lobs"`);
        await queryRunner.query(`DROP TABLE "treaty_lob_cobs"`);
        await queryRunner.query(`DROP TABLE "cob_master"`);
        await queryRunner.query(`DROP TABLE "lines_of_business"`);
        await queryRunner.query(`DROP TABLE "risk_companies"`);
        await queryRunner.query(`DROP TABLE "reinsurer_companies"`);
        await queryRunner.query(`DROP TABLE "mga_master"`);
    }

}
