import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCaliforniaLaeReservesItd1783700000000 implements MigrationInterface {
  name = 'UpdateCaliforniaLaeReservesItd1783700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Update California (stateCode = '5' or 'CA') AOE reserves in December 2025 ITD workbooks
    await queryRunner.query(
      `UPDATE "state_exhibits"
       SET "lae_reserves_aoe" = '{0, 35802.45, 35802.45}',
           "laeu" = '{0, 35802.45, 35802.45}'
       WHERE ("stateCode" = '5' OR "stateCode" = 'CA')
         AND "workbookId" IN (SELECT "id" FROM "workbooks" WHERE "source" = 'ITD' AND "monthKey" = '2025-12')`
    );

    // 2. Update TOTAL exhibit for December 2025 ITD workbooks to sum the new CA baseline
    await queryRunner.query(
      `UPDATE "state_exhibits"
       SET "lae_reserves_aoe" = '{0, 35802.45, 35802.45}'
       WHERE "stateCode" = 'TOTAL'
         AND "workbookId" IN (SELECT "id" FROM "workbooks" WHERE "source" = 'ITD' AND "monthKey" = '2025-12')`
    );

    // 3. Update California (stateCode = '5' or 'CA') AOE reserves in January 2026 APD FUT workbook (ID 6)
    await queryRunner.query(
      `UPDATE "state_exhibits"
       SET "lae_reserves_aoe" = '{35802.45, 53313.77, 53313.77}'
       WHERE ("stateCode" = '5' OR "stateCode" = 'CA')
         AND "workbookId" = 6`
    );

    // 4. Update TOTAL exhibit for January 2026 APD FUT workbook (ID 6)
    await queryRunner.query(
      `UPDATE "state_exhibits"
       SET "lae_reserves_aoe" = '{35802.45, 53313.77, 53313.77}'
       WHERE "stateCode" = 'TOTAL'
         AND "workbookId" = 6`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert California and TOTAL AOE reserves to default [0, 0, 0] for ITD December 2025 workbooks
    await queryRunner.query(
      `UPDATE "state_exhibits"
       SET "lae_reserves_aoe" = '{0, 0, 0}',
           "laeu" = '{0, 0, 0}'
       WHERE ("stateCode" = '5' OR "stateCode" = 'CA' OR "stateCode" = 'TOTAL')
         AND "workbookId" IN (SELECT "id" FROM "workbooks" WHERE "source" = 'ITD' AND "monthKey" = '2025-12')`
    );

    // Revert California and TOTAL AOE reserves to default [0, 53313.77, 53313.77] for January 2026 workbook (ID 6)
    await queryRunner.query(
      `UPDATE "state_exhibits"
       SET "lae_reserves_aoe" = '{0, 53313.77, 53313.77}'
       WHERE ("stateCode" = '5' OR "stateCode" = 'CA' OR "stateCode" = 'TOTAL')
         AND "workbookId" = 6`
    );
  }
}
