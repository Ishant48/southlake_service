import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteColumns1783225145073 implements MigrationInterface {
  name = 'AddSoftDeleteColumns1783225145073';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "mga_master" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "mga_master" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "mga_master" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "reinsurer_companies" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "reinsurer_companies" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "reinsurer_companies" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "lines_of_business" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "lines_of_business" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "lines_of_business" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "cob_master" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "cob_master" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "cob_master" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "state_master" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "state_master" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "state_master" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "treaties" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "treaties" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "treaties" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "state_documents" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "state_documents" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "state_documents" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "mga_documents" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "mga_documents" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "mga_documents" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "chart_of_accounts" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "chart_of_accounts" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "gl_mappings" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "gl_mappings" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "gl_mappings" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "chart_of_account_documents" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "chart_of_account_documents" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "chart_of_account_documents" ADD "deleted_by" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chart_of_account_documents" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "chart_of_account_documents" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "chart_of_account_documents" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "gl_mappings" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "gl_mappings" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "gl_mappings" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "chart_of_accounts" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "chart_of_accounts" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "chart_of_accounts" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "mga_documents" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "mga_documents" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "mga_documents" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "state_documents" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "state_documents" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "state_documents" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "treaties" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "state_master" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "state_master" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "state_master" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "cob_master" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "cob_master" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "cob_master" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "lines_of_business" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "lines_of_business" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "lines_of_business" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "reinsurer_companies" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "reinsurer_companies" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "reinsurer_companies" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "mga_master" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_deleted"`);
  }
}
