import { AppDataSource } from './data-source';

export async function seedPermissions(): Promise<void> {
  const isInitialized = AppDataSource.isInitialized;
  if (!isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Connected to database. Seeding module-specific permissions...');

    const modules = ['chart_of_accounts', 'master_data', 'journal_entry', 'reinsurance'];
    const actions = ['view', 'create', 'edit', 'approve', 'export', 'post', 'file', 'lock', 'override', 'reconcile', 'void', 'reverse'];

    // 1. Insert permissions
    for (const mod of modules) {
      const modLabel = mod.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      for (const act of actions) {
        const action = `${mod}.${act}`;
        const label = `${act.charAt(0).toUpperCase() + act.slice(1)} ${modLabel}`;
        const desc = `${act.charAt(0).toUpperCase() + act.slice(1)} ${mod.replace(/_/g, ' ')} records`;

        await queryRunner.query(`
          INSERT INTO "permissions" ("action", "label", "description")
          VALUES ($1, $2, $3)
          ON CONFLICT ("action") DO NOTHING
        `, [action, label, desc]);
      }
    }

    // 2. Fetch all permissions
    const perms = await queryRunner.query('SELECT id, action FROM permissions');

    // 3. Fetch roles
    const roles = await queryRunner.query('SELECT id, name FROM roles');
    const superadminRole = roles.find((r: any) => r.name === 'superadmin');
    const adminRole = roles.find((r: any) => r.name === 'admin');

    if (superadminRole) {
      console.log('Seeding superadmin role permissions...');
      for (const perm of perms) {
        await queryRunner.query(`
          INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [superadminRole.id, 'rbac', perm.id]);
      }
    }

    if (adminRole) {
      console.log('Seeding admin role permissions...');
      const adminActions = ['view', 'create', 'edit', 'approve', 'export', 'post'];
      const rbacAdminActions = ['user.view', 'user.create', 'user.edit', 'activity_log.view', 'activity_log.export'];

      for (const perm of perms) {
        let grant = false;
        if (rbacAdminActions.includes(perm.action)) {
          grant = true;
        } else {
          const parts = perm.action.split('.');
          if (parts.length > 1 && modules.includes(parts[0]) && adminActions.includes(parts[1])) {
            grant = true;
          }
        }

        if (grant) {
          await queryRunner.query(`
            INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
          `, [adminRole.id, 'rbac', perm.id]);
        }
      }
    }

    await queryRunner.commitTransaction();
    console.log('Permissions seeding transaction committed successfully!');
  } catch (error) {
    console.error('Error during permissions seeding, rolling back...', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    if (!isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedPermissions()
    .then(() => {
      console.log('Permissions seeding completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Permissions seeding failed:', err);
      process.exit(1);
    });
}
