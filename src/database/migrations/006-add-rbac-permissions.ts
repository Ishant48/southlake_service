import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRbacPermissions1700000000006 implements MigrationInterface {
  name = 'AddRbacPermissions1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "is_superadmin" boolean NOT NULL DEFAULT false
    `);

    const existingPermissions = await queryRunner.query(
      `SELECT "action" FROM "permissions"`,
    );
    const existingActions = new Set(existingPermissions.map((p: any) => p.action));

    const NEW_PERMISSIONS = [
      { action: 'user.view', label: 'View Users', description: 'View user list and details' },
      { action: 'user.create', label: 'Create Users', description: 'Invite new users' },
      { action: 'user.edit', label: 'Edit Users', description: 'Edit user profiles and deactivate' },
      { action: 'user.delete', label: 'Delete Users', description: 'Soft delete users' },
      { action: 'role.manage', label: 'Manage Roles', description: 'Create, edit, delete roles and permissions' },
      { action: 'permission.assign', label: 'Assign Permissions', description: 'Assign additional permissions to users' },
      { action: 'activity_log.view', label: 'View Activity Logs', description: 'View audit trail' },
      { action: 'activity_log.export', label: 'Export Activity Logs', description: 'Export audit logs as CSV' },
    ];

    for (const perm of NEW_PERMISSIONS) {
      if (!existingActions.has(perm.action)) {
        await queryRunner.query(`
          INSERT INTO "permissions" ("action", "label", "description")
          VALUES ('${perm.action}', '${perm.label}', '${perm.description}')
        `);
      }
    }

    const allPermissions = await queryRunner.query(
      `SELECT "id", "action" FROM "permissions"`,
    );
    const permMap = new Map<string, string>(
      allPermissions.map((p: any) => [p.action, p.id]),
    );

    const rbacActions = NEW_PERMISSIONS.map((p) => p.action);

    await queryRunner.query(`DELETE FROM "user_permissions"`);
    await queryRunner.query(`DELETE FROM "role_permissions"`);

    await queryRunner.query(`
      INSERT INTO "modules" ("id", "label")
      VALUES ('rbac', 'RBAC')
      ON CONFLICT ("id") DO NOTHING
    `);

    const roles = await queryRunner.query(`SELECT "id", "name" FROM "roles"`);
    const superadminRole = roles.find((r: any) => r.name === 'superadmin');
    const adminRole = roles.find((r: any) => r.name === 'admin');

    if (superadminRole) {
      for (const action of rbacActions) {
        const permId = permMap.get(action);
        if (permId) {
          await queryRunner.query(`
            INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
            VALUES ('${superadminRole.id}', 'rbac', '${permId}')
          `);
        }
      }
    }

    const adminRbacActions = ['user.view', 'user.create', 'user.edit', 'activity_log.view', 'activity_log.export'];
    if (adminRole) {
      for (const action of adminRbacActions) {
        const permId = permMap.get(action);
        if (permId) {
          await queryRunner.query(`
            INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
            VALUES ('${adminRole.id}', 'rbac', '${permId}')
          `);
        }
      }
    }

    await queryRunner.query(`
      UPDATE "users"
      SET "is_superadmin" = true
      WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'superadmin')
    `);

    const superadminPermIds = rbacActions
      .map((a) => permMap.get(a))
      .filter(Boolean) as string[];
    const adminPermIds = adminRbacActions
      .map((a) => permMap.get(a))
      .filter(Boolean) as string[];
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rbacActions = [
      'user.view', 'user.create', 'user.edit', 'user.delete',
      'role.manage', 'permission.assign',
      'activity_log.view', 'activity_log.export',
    ];

    for (const action of rbacActions) {
      await queryRunner.query(
        `DELETE FROM "permissions" WHERE "action" = '${action}'`,
      );
    }

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_superadmin"`);
  }
}
