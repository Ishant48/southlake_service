import { MigrationInterface, QueryRunner } from 'typeorm';

export class PendingInviteExtraFields1700000000005 implements MigrationInterface {
  name = 'PendingInviteExtraFields1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pending_invites"
        ADD COLUMN IF NOT EXISTS "user_type" character varying,
        ADD COLUMN IF NOT EXISTS "department" character varying,
        ADD COLUMN IF NOT EXISTS "title" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pending_invites"
        DROP COLUMN IF EXISTS "user_type",
        DROP COLUMN IF EXISTS "department",
        DROP COLUMN IF EXISTS "title"
    `);
  }
}
