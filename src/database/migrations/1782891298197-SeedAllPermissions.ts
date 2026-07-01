import { MigrationInterface, QueryRunner } from 'typeorm';

const MODULES = [
  { id: 'chart_of_accounts', label: 'Chart of Accounts' },
  { id: 'master_data', label: 'Master Data' },
  { id: 'journal_entry', label: 'Journal Entries' },
  { id: 'reinsurance', label: 'Premium and claims Exhibits' },
];

const ACTIONS = [
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

const ADMIN_ACTIONS = ['view', 'create', 'edit', 'approve', 'export'];

export class SeedAllPermissions1782891298197 implements MigrationInterface {
  name = 'SeedAllPermissions1782891298197';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Insert modules
    for (const mod of MODULES) {
      await queryRunner.query(`
        INSERT INTO "modules" ("id", "label")
        VALUES ('${mod.id}', '${mod.label}')
        ON CONFLICT ("id") DO UPDATE SET "label" = EXCLUDED.label
      `);
    }

    // 2. Insert permissions for each module-action combination
    const createdPermissions: { id: string; action: string; moduleId: string }[] = [];
    
    for (const mod of MODULES) {
      for (const act of ACTIONS) {
        const actionName = `${mod.id}.${act.action}`;
        const labelName = `${act.label} ${mod.label}`;
        const descName = `${act.description} for ${mod.label}`;

        // Insert into permissions table
        await queryRunner.query(`
          INSERT INTO "permissions" ("action", "label", "description")
          VALUES ('${actionName}', '${labelName}', '${descName}')
          ON CONFLICT ("action") DO UPDATE SET "label" = EXCLUDED.label, "description" = EXCLUDED.description
        `);

        // Fetch back the generated permission with its ID
        const permRow = await queryRunner.query(
          `SELECT "id" FROM "permissions" WHERE "action" = '${actionName}'`
        );
        if (permRow && permRow.length > 0) {
          createdPermissions.push({
            id: permRow[0].id,
            action: act.action,
            moduleId: mod.id,
          });
        }
      }
    }

    // 3. Map permissions to Super Admin and Admin roles
    const superadminRole = await queryRunner.query(
      `SELECT "id" FROM "roles" WHERE "name" = 'superadmin'`
    );
    const adminRole = await queryRunner.query(
      `SELECT "id" FROM "roles" WHERE "name" = 'admin'`
    );

    if (superadminRole && superadminRole.length > 0) {
      const superadminId = superadminRole[0].id;
      for (const perm of createdPermissions) {
        await queryRunner.query(`
          INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
          VALUES ('${superadminId}', 'rbac', '${perm.id}')
          ON CONFLICT DO NOTHING
        `);
      }
    }

    if (adminRole && adminRole.length > 0) {
      const adminId = adminRole[0].id;
      for (const perm of createdPermissions) {
        if (ADMIN_ACTIONS.includes(perm.action)) {
          await queryRunner.query(`
            INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
            VALUES ('${adminId}', 'rbac', '${perm.id}')
            ON CONFLICT DO NOTHING
          `);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clean up created permissions and role mappings
    for (const mod of MODULES) {
      for (const act of ACTIONS) {
        const actionName = `${mod.id}.${act.action}`;
        const permRow = await queryRunner.query(
          `SELECT "id" FROM "permissions" WHERE "action" = '${actionName}'`
        );
        if (permRow && permRow.length > 0) {
          const permId = permRow[0].id;
          await queryRunner.query(`DELETE FROM "role_permissions" WHERE "permission_id" = '${permId}'`);
          await queryRunner.query(`DELETE FROM "permissions" WHERE "id" = '${permId}'`);
        }
      }
    }
  }
}
