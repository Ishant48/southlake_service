import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateItdBaselineAllFields1783500000000 implements MigrationInterface {
  name = 'UpdateItdBaselineAllFields1783500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update all December 2025 ITD workbooks (source = 'ITD') state exhibits for California (stateCode '5' or 'CA')
    // to have loss_reserves and lu columns set to [0, 213440.35, 213440.35]
    await queryRunner.query(
      `UPDATE "state_exhibits"
       SET "loss_reserves" = '{0, 213440.35, 213440.35}', "lu" = '{0, 213440.35, 213440.35}'
       WHERE ("stateCode" = '5' OR "stateCode" = 'CA')
         AND "workbookId" IN (SELECT "id" FROM "workbooks" WHERE "source" = 'ITD' AND "monthKey" = '2025-12')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert loss_reserves and lu to '{0,0,0}'
    await queryRunner.query(
      `UPDATE "state_exhibits"
       SET "loss_reserves" = '{0,0,0}', "lu" = '{0,0,0}'
       WHERE ("stateCode" = '5' OR "stateCode" = 'CA')
         AND "workbookId" IN (SELECT "id" FROM "workbooks" WHERE "source" = 'ITD' AND "monthKey" = '2025-12')`
    );
  }
}
