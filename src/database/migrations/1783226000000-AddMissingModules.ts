import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingModules1783226000000 implements MigrationInterface {
  name = 'AddMissingModules1783226000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "modules" ("id", "label") VALUES ('master_data', 'Master Data') ON CONFLICT ("id") DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "modules" ("id", "label") VALUES ('reinsurance', 'Premium and claims Exhibits') ON CONFLICT ("id") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "modules" WHERE "id" IN ('master_data', 'reinsurance')`);
  }
}
