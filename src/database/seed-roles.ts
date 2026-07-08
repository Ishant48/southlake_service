import { AppDataSource } from './data-source';
import { QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

const DEFAULT_SUPERADMIN_PASSWORD = 'Admin@123';

/**
 * Seeds the two system roles and the initial superadmin user. Previously
 * done as data embedded in migrations 002/003 — moved here because schema
 * migrations shouldn't carry seed data (a `migration:generate` diff against
 * entities can never reproduce hand-written INSERT statements). Must run
 * before seedPermissions(), which assumes these roles already exist.
 */
export async function seedRoles(externalQueryRunner?: QueryRunner): Promise<void> {
  const isInitialized = AppDataSource.isInitialized;
  const useExternal = !!externalQueryRunner;

  const queryRunner = externalQueryRunner ?? AppDataSource.createQueryRunner();

  if (!useExternal) {
    if (!isInitialized) {
      await AppDataSource.initialize();
    }
    await queryRunner.connect();
    await queryRunner.startTransaction();
  }

  try {
    console.warn('Seeding system roles...');
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "label", "color", "is_system", "description")
      VALUES
        ('superadmin', 'Super Admin', '#0d1b4b', true, 'Full access to all modules and user management'),
        ('admin', 'Admin', '#e05470', true, 'Administrative access with user management')
      ON CONFLICT ("name") DO NOTHING
    `);

    const superadminRole = (await queryRunner.query(
      `SELECT "id" FROM "roles" WHERE "name" = 'superadmin'`,
    )) as Array<{ id: string }>;
    const roleId: string = superadminRole[0].id;

    console.warn('Seeding superadmin user (admin@southlake.com)...');
    const passwordHash = await bcrypt.hash(DEFAULT_SUPERADMIN_PASSWORD, 10);
    await queryRunner.query(
      `
      INSERT INTO "users" ("email", "role_id", "user_type", "name", "initials", "avatar_color", "status", "password_hash", "is_superadmin", "department", "title")
      VALUES ($1, $2, 'staff', 'Super Admin', 'SA', '#0d1b4b', 'active', $3, true, 'Administration', 'Super Admin')
      ON CONFLICT ("email") DO UPDATE SET
        "department" = 'Administration',
        "title" = 'Super Admin'
    `,
      ['admin@southlake.com', roleId, passwordHash],
    );

    if (!useExternal) {
      await queryRunner.commitTransaction();
      console.warn('Roles seeding transaction committed successfully!');
    }
  } catch (error) {
    console.error('Error during roles seeding, rolling back...', error);
    if (!useExternal) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  } finally {
    if (!useExternal) {
      await queryRunner.release();
      if (!isInitialized) {
        await AppDataSource.destroy();
      }
    }
  }
}

if (require.main === module) {
  seedRoles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
