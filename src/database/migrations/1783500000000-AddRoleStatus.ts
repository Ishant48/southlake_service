import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleStatus1783500000000 implements MigrationInterface {
  name = 'AddRoleStatus1783500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" ADD "is_active" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_active"`);
  }
}
