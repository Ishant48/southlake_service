import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * treaty_state_carriers.state_id was NOT NULL but TreatyCarrierDto.state_id is
 * declared optional (a treaty's primary carrier is often set without a
 * per-state breakdown) - creating a treaty via the single-carrier flow
 * violated this constraint. Relax it to match the DTO contract.
 */
export class TreatyCarrierNullableState1783231000000 implements MigrationInterface {
  name = 'TreatyCarrierNullableState1783231000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" ALTER COLUMN "state_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "treaty_state_carriers" ALTER COLUMN "state_id" SET NOT NULL`,
    );
  }
}
