import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULES = [
  { id: 'journal_entry', label: 'Journal Entry' },
  { id: 'claims', label: 'Claims' },
  { id: 'billing', label: 'Billing' },
  { id: 'reinsurance', label: 'Reinsurance' },
  { id: 'mga', label: 'MGA' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'period_locking', label: 'Period Locking' },
  { id: 'audit_trail', label: 'Audit Trail' },
  { id: 'user_management', label: 'User Management' },
];

const PERMISSIONS = [
  { action: 'view', label: 'View', description: 'View records' },
  { action: 'create', label: 'Create', description: 'Create new records' },
  { action: 'edit', label: 'Edit', description: 'Edit existing records' },
  { action: 'approve', label: 'Approve', description: 'Approve records' },
  { action: 'export', label: 'Export', description: 'Export data' },
  { action: 'post', label: 'Post', description: 'Post records' },
  { action: 'file', label: 'File', description: 'File records' },
  { action: 'lock', label: 'Lock', description: 'Lock periods or records' },
  { action: 'override', label: 'Override', description: 'Override locked records' },
  { action: 'reconcile', label: 'Reconcile', description: 'Reconcile records' },
  { action: 'void', label: 'Void', description: 'Void records' },
  { action: 'reverse', label: 'Reverse', description: 'Reverse transactions' },
];

const ADMIN_PERMISSIONS = ['view', 'create', 'edit', 'approve', 'export'];

export class SeedRolesModules1700000000002 implements MigrationInterface {
  name = 'SeedRolesModules1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert roles
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "label", "color", "is_system", "description")
      VALUES
        ('superadmin', 'Super Admin', '#0d1b4b', true, 'Full access to all modules and user management'),
        ('admin', 'Admin', '#e05470', true, 'Administrative access with user management')
      ON CONFLICT ("name") DO NOTHING
    `);

    // Insert modules
    for (const mod of MODULES) {
      await queryRunner.query(`
        INSERT INTO "modules" ("id", "label")
        VALUES ('${mod.id}', '${mod.label}')
        ON CONFLICT ("id") DO NOTHING
      `);
    }

    // Insert permissions
    for (const perm of PERMISSIONS) {
      await queryRunner.query(`
        INSERT INTO "permissions" ("action", "label", "description")
        VALUES ('${perm.action}', '${perm.label}', '${perm.description}')
        ON CONFLICT ("action") DO NOTHING
      `);
    }

    // Get role IDs
    const superadminRole = await queryRunner.query(
      `SELECT "id" FROM "roles" WHERE "name" = 'superadmin'`,
    );
    const adminRole = await queryRunner.query(
      `SELECT "id" FROM "roles" WHERE "name" = 'admin'`,
    );

    const superadminId: string = superadminRole[0].id;
    const adminId: string = adminRole[0].id;

    // Get all permission IDs
    const allPermissions = await queryRunner.query(
      `SELECT "id", "action" FROM "permissions"`,
    );

    // Superadmin: all permissions on all modules
    for (const mod of MODULES) {
      for (const perm of allPermissions) {
        await queryRunner.query(`
          INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
          VALUES ('${superadminId}', '${mod.id}', '${perm.id}')
          ON CONFLICT DO NOTHING
        `);
      }
    }

    // Admin: view + create + edit + approve + export on all modules
    const adminPerms = allPermissions.filter((p: { action: string }) =>
      ADMIN_PERMISSIONS.includes(p.action),
    );
    for (const mod of MODULES) {
      for (const perm of adminPerms) {
        await queryRunner.query(`
          INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
          VALUES ('${adminId}', '${mod.id}', '${perm.id}')
          ON CONFLICT DO NOTHING
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "role_permissions"`);
    await queryRunner.query(`DELETE FROM "permissions"`);
    await queryRunner.query(`DELETE FROM "modules"`);
    await queryRunner.query(`DELETE FROM "roles" WHERE "is_system" = true`);
  }
}
