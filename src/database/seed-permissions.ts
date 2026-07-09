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
  treaty_type: { label: 'Treaty Types' },
  reinsurance: { label: 'Reinsurance Calculations' },
  reports: { label: 'Reports', extraActions: ['post'] },
  test_balance: { label: 'Test Balance' },
  workbook: { label: 'Workbooks' },
  financial_reports: { label: 'Financial Reports' },
  database_seeder: { label: 'Database Seeder', extraActions: ['manage'] },
};

const CRUD_ACTIONS = ['view', 'create', 'edit', 'delete'];

/**
 * Navigation metadata for the dynamic sidebar (GET /permissions/my-modules).
 * Only modules that should appear as a sidebar entry get an entry here -
 * everything else (e.g. reports, workbook, permission) stays invisible by
 * having no parentModuleId and no children, matching today's sidebar which
 * never linked to those either. Parent groups (accounting/master_data/
 * user_management) carry no permissionAction of their own - visibility is
 * the OR of their children's visibility, computed in permissions.service.ts.
 */
interface NavMeta {
  icon?: string;
  route?: string;
  sortOrder: number;
  parentModuleId?: string;
  permissionAction?: string;
  label?: string;
}

const NAV_META: Record<string, NavMeta> = {
  accounting: { icon: 'accounting', sortOrder: 10, label: 'Advanced Accounting' },
  chart_of_accounts: {
    icon: 'chart-of-accounts',
    route: '/chart-of-accounts',
    sortOrder: 0,
    parentModuleId: 'accounting',
  },
  journal_entry: {
    icon: 'journal-entry',
    route: '/journal-entries',
    sortOrder: 1,
    parentModuleId: 'accounting',
  },
  reinsurance: {
    icon: 'reinsurance',
    route: '/reinsurance-calculations',
    sortOrder: 2,
    parentModuleId: 'accounting',
  },

  master_data: { icon: 'masters', sortOrder: 20, label: 'Masters' },
  treaty: {
    icon: 'treaty',
    route: '/masters?tab=treaties',
    sortOrder: 0,
    parentModuleId: 'master_data',
  },
  mga: { icon: 'mga', route: '/masters?tab=mgas', sortOrder: 1, parentModuleId: 'master_data' },
  lob: { icon: 'lob', route: '/masters?tab=lobs', sortOrder: 2, parentModuleId: 'master_data' },
  cob: { icon: 'cob', route: '/masters?tab=cobs', sortOrder: 3, parentModuleId: 'master_data' },
  state: {
    icon: 'state',
    route: '/masters?tab=states',
    sortOrder: 4,
    parentModuleId: 'master_data',
  },
  reinsurer: {
    icon: 'reinsurer',
    route: '/masters?tab=reinsurers',
    sortOrder: 5,
    parentModuleId: 'master_data',
  },
  risk_company: {
    icon: 'risk-company',
    route: '/masters?tab=risk-companies',
    sortOrder: 6,
    parentModuleId: 'master_data',
  },
  broker: {
    icon: 'broker',
    route: '/masters?tab=brokers',
    sortOrder: 7,
    parentModuleId: 'master_data',
  },
  product: {
    icon: 'product',
    route: '/masters?tab=products',
    sortOrder: 8,
    parentModuleId: 'master_data',
  },
  masters_config: {
    icon: 'document-types',
    route: '/masters?tab=document-types',
    sortOrder: 9,
    parentModuleId: 'master_data',
    label: 'Document Types',
  },
  gl_mapping: {
    icon: 'gl-mapping',
    route: '/masters?tab=gl-mappings',
    sortOrder: 10,
    parentModuleId: 'master_data',
  },

  user_management: { icon: 'admin', sortOrder: 30, label: 'System Admin' },
  user: {
    icon: 'users',
    route: '/user-management/users',
    sortOrder: 0,
    parentModuleId: 'user_management',
  },
  role: {
    icon: 'roles',
    route: '/user-management/roles',
    sortOrder: 1,
    parentModuleId: 'user_management',
    permissionAction: 'role.manage',
  },
  activity_log: {
    icon: 'activity-log',
    route: '/user-management/activity-logs',
    sortOrder: 2,
    parentModuleId: 'user_management',
  },
};

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
    // uses to group access-control grants. 'accounting'/'master_data'/
    // 'user_management' are pure nav-grouping parents (no permissions of
    // their own) - visibility is derived from their children, see NAV_META.
    const pseudoModuleIds = ['rbac', 'accounting', 'user_management', 'master_data'];
    for (const modId of [...Object.keys(MODULES), ...pseudoModuleIds]) {
      const label =
        NAV_META[modId]?.label ??
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

    console.warn('Applying sidebar navigation metadata...');
    for (const [modId, meta] of Object.entries(NAV_META)) {
      await queryRunner.query(
        `UPDATE "modules"
         SET "label" = $2, "icon" = $3, "route" = $4, "sort_order" = $5,
             "parent_module_id" = $6, "permission_action" = $7
         WHERE "id" = $1`,
        [
          modId,
          meta.label ?? MODULES[modId]?.label ?? modId,
          meta.icon ?? null,
          meta.route ?? null,
          meta.sortOrder,
          meta.parentModuleId ?? null,
          meta.permissionAction ?? null,
        ],
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
