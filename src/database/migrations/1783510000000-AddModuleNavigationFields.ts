import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuleNavigationFields1783510000000 implements MigrationInterface {
  name = 'AddModuleNavigationFields1783510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "modules" ADD "icon" varchar`);
    await queryRunner.query(`ALTER TABLE "modules" ADD "route" varchar`);
    await queryRunner.query(`ALTER TABLE "modules" ADD "sort_order" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "modules" ADD "parent_module_id" varchar`);
    await queryRunner.query(`ALTER TABLE "modules" ADD "permission_action" varchar`);
    await queryRunner.query(
      `ALTER TABLE "modules" ADD CONSTRAINT "FK_modules_parent_module" FOREIGN KEY ("parent_module_id") REFERENCES "modules"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "modules" DROP CONSTRAINT "FK_modules_parent_module"`);
    await queryRunner.query(`ALTER TABLE "modules" DROP COLUMN "permission_action"`);
    await queryRunner.query(`ALTER TABLE "modules" DROP COLUMN "parent_module_id"`);
    await queryRunner.query(`ALTER TABLE "modules" DROP COLUMN "sort_order"`);
    await queryRunner.query(`ALTER TABLE "modules" DROP COLUMN "route"`);
    await queryRunner.query(`ALTER TABLE "modules" DROP COLUMN "icon"`);
  }
}
