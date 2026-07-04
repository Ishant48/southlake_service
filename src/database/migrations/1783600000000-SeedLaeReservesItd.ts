import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedLaeReservesItd1783600000000 implements MigrationInterface {
  name = 'SeedLaeReservesItd1783600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Explicitly initialize lae_reserves_dcc and lae_reserves_aoe columns to [0, 0, 0]
    // for all December 2025 ITD workbooks state exhibits if not already set.
    await queryRunner.query(
      `UPDATE "state_exhibits"
       SET "lae_reserves_dcc" = COALESCE("lae_reserves_dcc", '{0, 0, 0}'),
           "lae_reserves_aoe" = COALESCE("lae_reserves_aoe", '{0, 0, 0}')
       WHERE "workbookId" IN (SELECT "id" FROM "workbooks" WHERE "source" = 'ITD' AND "monthKey" = '2025-12')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op rollback since we just populated defaults if they were null
  }
}
