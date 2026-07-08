import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStateIdsToTreatyReinsurer1783485000000 implements MigrationInterface {
  name = 'AddStateIdsToTreatyReinsurer1783485000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "treaty_reinsurers" ADD "state_ids" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP COLUMN "state_ids"`);
  }
}
