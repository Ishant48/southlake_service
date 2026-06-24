import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class AddPasswordHash1700000000004 implements MigrationInterface {
  name = 'AddPasswordHash1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar
    `);

    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await queryRunner.query(
      `UPDATE "users" SET "password_hash" = $1 WHERE "email" = $2 AND "password_hash" IS NULL`,
      [passwordHash, 'admin@southlake.com'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash"`);
  }
}
