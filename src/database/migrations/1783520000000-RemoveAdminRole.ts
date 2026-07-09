import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAdminRole1783520000000 implements MigrationInterface {
  name = 'RemoveAdminRole1783520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminRole = (await queryRunner.query(
      `SELECT "id" FROM "roles" WHERE "name" = 'admin'`,
    )) as Array<{ id: string }>;

    if (adminRole.length === 0) {
      return;
    }

    const roleId = adminRole[0].id;

    const usersOnRole = (await queryRunner.query(
      `SELECT "id" FROM "users" WHERE "role_id" = $1 AND "is_deleted" = false`,
      [roleId],
    )) as Array<{ id: string }>;

    if (usersOnRole.length > 0) {
      throw new Error(
        `Cannot remove 'admin' role: ${usersOnRole.length} active user(s) are still assigned to it. Reassign them before running this migration.`,
      );
    }

    await queryRunner.query(`DELETE FROM "role_permissions" WHERE "role_id" = $1`, [roleId]);
    await queryRunner.query(`DELETE FROM "roles" WHERE "id" = $1`, [roleId]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "label", "color", "is_system", "description")
      VALUES ('admin', 'Admin', '#e05470', true, 'Administrative access with user management')
      ON CONFLICT ("name") DO NOTHING
    `);
  }
}
