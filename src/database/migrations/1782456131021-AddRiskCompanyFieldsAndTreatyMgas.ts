import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRiskCompanyFieldsAndTreatyMgas1782456131021 implements MigrationInterface {
    name = 'AddRiskCompanyFieldsAndTreatyMgas1782456131021'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "treaty_mgas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treaty_id" uuid NOT NULL, "mga_id" uuid NOT NULL, CONSTRAINT "PK_4d75d2316837f83f535ee3f3db3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`INSERT INTO "treaty_mgas" ("treaty_id", "mga_id") SELECT "id", "mga_id" FROM "treaties" WHERE "mga_id" IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD "zip" character varying`);
        await queryRunner.query(`ALTER TABLE "risk_companies" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP CONSTRAINT "FK_f7c94d27a65f232ff88ffb470f4"`);
        await queryRunner.query(`ALTER TABLE "treaties" ALTER COLUMN "mga_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "treaty_mgas" ADD CONSTRAINT "FK_9bedd08208ec57db492d0f40040" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_mgas" ADD CONSTRAINT "FK_61cbb5d34914c8e8ed97ce1aa83" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD CONSTRAINT "FK_f7c94d27a65f232ff88ffb470f4" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treaties" DROP CONSTRAINT "FK_f7c94d27a65f232ff88ffb470f4"`);
        await queryRunner.query(`ALTER TABLE "treaty_mgas" DROP CONSTRAINT "FK_61cbb5d34914c8e8ed97ce1aa83"`);
        await queryRunner.query(`ALTER TABLE "treaty_mgas" DROP CONSTRAINT "FK_9bedd08208ec57db492d0f40040"`);
        await queryRunner.query(`ALTER TABLE "treaties" ALTER COLUMN "mga_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD CONSTRAINT "FK_f7c94d27a65f232ff88ffb470f4" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP COLUMN "zip"`);
        await queryRunner.query(`ALTER TABLE "risk_companies" DROP COLUMN "address"`);
        await queryRunner.query(`DROP TABLE "treaty_mgas"`);
    }

}
