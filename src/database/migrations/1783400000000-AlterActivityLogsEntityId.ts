import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterActivityLogsEntityId1783400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "activity_logs" 
      ALTER COLUMN "entity_id" TYPE character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "activity_logs" 
      ALTER COLUMN "entity_id" TYPE uuid USING entity_id::uuid
    `);
  }
}
