import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContinuousConnectorsToTreaties1783540000000 implements MigrationInterface {
  name = 'AddContinuousConnectorsToTreaties1783540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD "is_continuous" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD "policy_state_connector" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD "claim_state_connector" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "claim_state_connector"`);
    await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "policy_state_connector"`);
    await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "is_continuous"`);
  }
}
