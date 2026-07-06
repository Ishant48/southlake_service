import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * state_exhibits stores 21 money-bearing numeric[] columns with no precision/scale
 * (audit finding), unlike every other money column in the schema which declares
 * numeric(15,2). Aligns them so values can't silently exceed the precision used
 * everywhere else the same figures are consumed (journal entries, ITD totals).
 */
export class StateExhibitNumericPrecision1783228000000 implements MigrationInterface {
  name = 'StateExhibitNumericPrecision1783228000000';

  private readonly columns = [
    'pw',
    'pfw',
    'pc',
    'pfc',
    'tax',
    'lp',
    'laep',
    'ae_paid',
    'pe',
    'pfe',
    'uep',
    'lu',
    'laeu',
    'aeu',
    'loss_reserves',
    'lae_reserves_dcc',
    'lae_reserves_aoe',
    'loss_ibnr',
    'lae_ibnr_dcc',
    'lae_ibnr_aoe',
    'ulae_ibnr',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const column of this.columns) {
      await queryRunner.query(
        `ALTER TABLE state_exhibits ALTER COLUMN "${column}" TYPE numeric(15,2)[] USING "${column}"::numeric(15,2)[]`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of this.columns) {
      await queryRunner.query(
        `ALTER TABLE state_exhibits ALTER COLUMN "${column}" TYPE numeric[] USING "${column}"::numeric[]`,
      );
    }
  }
}
