import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkbookStatus1782760000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workbooks" ADD "status" character varying NOT NULL DEFAULT 'Pending'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workbooks" DROP COLUMN "status"`);
  }
}
