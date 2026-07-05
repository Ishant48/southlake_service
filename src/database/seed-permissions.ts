import { AppDataSource } from './data-source';
import { QueryRunner } from 'typeorm';

/**
 * One row per real feature module, each granted the standard CRUD action
 * set (view/create/edit/delete) plus any extra actions that module's
 * controller actually checks for (e.g. journal_entry.post for posting a
 * batch — see PostToJournalEntries). Keep this in sync with every
 * @RequirePermission(...) string used across src/modules/**\/*.controller.ts —
 * a permission a controller checks for but this seed never creates can
 * only ever be satisfied by the superadmin guard bypass, never by a real
 * role grant.
 */
const MODULES: Record<string, { label: string; extraActions?: string[] }> = {
  activity_log: { label: 'Activity Logs', extraActions: ['export'] },
  role: { label: 'Roles', extraActions: ['manage'] },
  permission: { label: 'Permissions', extraActions: ['assign'] },
  user: { label: 'Users' },
  chart_of_accounts: { label: 'Chart of Accounts' },
  gl_mapping: { label: 'GL Mappings' },
  journal_entry: { label: 'Journal Entries', extraActions: ['post'] },
  broker: { label: 'Brokers' },
  cob: { label: 'Classes of Business' },
  lob: { label: 'Lines of Business' },
  masters_config: { label: 'Masters Configuration' },
  mga: { label: 'MGAs' },
  product: { label: 'Products' },
  reinsurer: { label: 'Reinsurers' },
  risk_company: { label: 'Risk Companies' },
  state: { label: 'States' },
  treaty: { label: 'Treaties' },
  reports: { label: 'Reports', extraActions: ['post'] },
  test_balance: { label: 'Test Balance' },
  workbook: { label: 'Workbooks' },
  financial_reports: { label: 'Financial Reports' },
  database_seeder: { label: 'Database Seeder', extraActions: ['manage'] },
};

const CRUD_ACTIONS = ['view', 'create', 'edit', 'delete'];

interface PermissionRow {
  id: string;
  action: string;
}

interface RoleRow {
  id: string;
  name: string;
}

export async function seedPermissions(externalQueryRunner?: QueryRunner): Promise<void> {
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
    console.warn('Ensuring required modules exist...');
    // 'rbac' is not a real feature module — it's the module_id role_permissions
    // uses to group access-control grants. 'user_management' is a legacy alias
    // still referenced by some role_permissions rows.
    const pseudoModuleIds = ['rbac', 'user_management'];
    for (const modId of [...Object.keys(MODULES), ...pseudoModuleIds]) {
      const label =
        MODULES[modId]?.label ??
        modId
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      await queryRunner.query(
        `INSERT INTO "modules" ("id", "label") VALUES ($1, $2) ON CONFLICT ("id") DO NOTHING`,
        [modId, modId === 'rbac' ? 'Access Control' : label],
      );
    }

    console.warn('Seeding permissions...');
    for (const [modId, def] of Object.entries(MODULES)) {
      const actions = [...CRUD_ACTIONS, ...(def.extraActions ?? [])];
      for (const act of actions) {
        const action = `${modId}.${act}`;
        const label = `${act.charAt(0).toUpperCase() + act.slice(1)} ${def.label}`;
        const desc = `${label}`;
        await queryRunner.query(
          `INSERT INTO "permissions" ("action", "label", "description")
           VALUES ($1, $2, $3)
           ON CONFLICT ("action") DO NOTHING`,
          [action, label, desc],
        );
      }
    }

    const perms = (await queryRunner.query(
      'SELECT id, action FROM permissions',
    )) as PermissionRow[];
    const roles = (await queryRunner.query('SELECT id, name FROM roles')) as RoleRow[];
    const superadminRole = roles.find(r => r.name === 'superadmin');
    const adminRole = roles.find(r => r.name === 'admin');

    if (superadminRole) {
      console.warn('Seeding superadmin role permissions (all)...');
      for (const perm of perms) {
        await queryRunner.query(
          `INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [superadminRole.id, 'rbac', perm.id],
        );
      }
    }

    if (adminRole) {
      console.warn(
        'Seeding admin role permissions (view/create/edit + user/activity_log management)...',
      );
      const adminActions = ['view', 'create', 'edit'];
      const alwaysGrantToAdmin = [
        'user.view',
        'user.create',
        'user.edit',
        'activity_log.view',
        'activity_log.export',
      ];

      for (const perm of perms) {
        const [, act] = perm.action.split('.');
        const grant = alwaysGrantToAdmin.includes(perm.action) || adminActions.includes(act);
        if (grant) {
          await queryRunner.query(
            `INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [adminRole.id, 'rbac', perm.id],
          );
        }
      }
    }

    if (!useExternal) {
      await queryRunner.commitTransaction();
      console.warn('Permissions seeding transaction committed successfully!');
    }
  } catch (error) {
    console.error('Error during permissions seeding, rolling back...', error);
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
  seedPermissions()
    .then(() => {
      console.warn('Permissions seeding completed successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Permissions seeding failed:', err);
      process.exit(1);
    });
}
