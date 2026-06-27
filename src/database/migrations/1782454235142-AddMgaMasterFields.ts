import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMgaMasterFields1782454235142 implements MigrationInterface {
    name = 'AddMgaMasterFields1782454235142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "company_id" bigint`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "id_name" character varying`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "zip" character varying`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "open_item" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "op_start_date" date`);
        await queryRunner.query(`ALTER TABLE "mga_master" ADD "other_names" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "other_names"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "op_start_date"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "open_item"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "zip"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "id_name"`);
        await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "company_id"`);
    }

}
