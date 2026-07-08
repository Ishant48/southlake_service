import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAslCodeToCobMaster1783483000000 implements MigrationInterface {
  name = 'AddAslCodeToCobMaster1783483000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cob_master" ADD "asl_code" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cob_master" DROP COLUMN "asl_code"`);
  }
}
