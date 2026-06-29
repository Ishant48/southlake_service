import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLobCobFields1782455233441 implements MigrationInterface {
    name = 'AddLobCobFields1782455233441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lines_of_business" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "lines_of_business" ADD "type" character varying`);
        await queryRunner.query(`ALTER TABLE "lines_of_business" ADD "taxable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "lines_of_business" ADD "priority" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "lines_of_business" ADD "fully_earned" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "cob_master" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "cob_master" ADD "type" character varying`);
        await queryRunner.query(`ALTER TABLE "cob_master" ADD "taxable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "cob_master" ADD "priority" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "cob_master" ADD "fully_earned" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cob_master" DROP COLUMN "fully_earned"`);
        await queryRunner.query(`ALTER TABLE "cob_master" DROP COLUMN "priority"`);
        await queryRunner.query(`ALTER TABLE "cob_master" DROP COLUMN "taxable"`);
        await queryRunner.query(`ALTER TABLE "cob_master" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "cob_master" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "lines_of_business" DROP COLUMN "fully_earned"`);
        await queryRunner.query(`ALTER TABLE "lines_of_business" DROP COLUMN "priority"`);
        await queryRunner.query(`ALTER TABLE "lines_of_business" DROP COLUMN "taxable"`);
        await queryRunner.query(`ALTER TABLE "lines_of_business" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "lines_of_business" DROP COLUMN "description"`);
    }

}
