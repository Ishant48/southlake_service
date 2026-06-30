import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLaeDccAoeToTreaties1782848123456 implements MigrationInterface {
    name = 'AddLaeDccAoeToTreaties1782848123456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treaties" ADD "lae_dcc_pct" decimal(6,2)`);
        await queryRunner.query(`ALTER TABLE "treaties" ADD "lae_aoe_pct" decimal(6,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "lae_aoe_pct"`);
        await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "lae_dcc_pct"`);
    }
}
