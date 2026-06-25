import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSuperadminUser1700000000003 implements MigrationInterface {
  name = 'SeedSuperadminUser1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const superadminRole = await queryRunner.query(
      `SELECT "id" FROM "roles" WHERE "name" = 'superadmin'`,
    );

    if (!superadminRole.length) {
      throw new Error('Superadmin role not found. Run migration 002 first.');
    }

    const roleId: string = superadminRole[0].id;

    await queryRunner.query(`
      INSERT INTO "users" (
        "email", "role_id", "user_type", "name", "initials",
        "avatar_color", "status"
      )
      VALUES (
        'admin@southlake.com', '${roleId}', 'staff', 'Super Admin', 'SA',
        '#0d1b4b', 'active'
      )
      ON CONFLICT ("email") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = 'admin@southlake.com'`,
    );
  }
}
