import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveNaicsCodeFromMga1783484000000 implements MigrationInterface {
  name = 'RemoveNaicsCodeFromMga1783484000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "naics_code"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "mga_master" ADD "naics_code" character varying`);
  }
}
