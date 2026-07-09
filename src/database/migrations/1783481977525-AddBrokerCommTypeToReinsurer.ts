import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrokerCommTypeToReinsurer1783481977525 implements MigrationInterface {
  name = 'AddBrokerCommTypeToReinsurer1783481977525';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "treaty_reinsurers" ADD "broker_comm_type" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP COLUMN "broker_comm_type"`);
  }
}
