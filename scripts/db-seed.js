#!/usr/bin/env node
'use strict';

/**
 * Seeds base data (roles, modules, permissions, role_permissions, superadmin user)
 * into an already-migrated database. Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
 *
 * Usage:
 *   dotenv -e .env.development -- node scripts/db-seed.js
 *   dotenv -e .env.test        -- node scripts/db-seed.js
 */

const { Client } = require('pg');

const DB_NAME = process.env.DATABASE_NAME;
const DB_USER = process.env.DATABASE_USER;
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DATABASE_PORT || '5432', 10);
const DB_PASSWORD = process.env.DATABASE_PASSWORD || undefined;

if (!DB_NAME || !DB_USER) {
  console.error('Missing DATABASE_NAME or DATABASE_USER env vars');
  process.exit(1);
}

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

const ADMIN_ACTIONS = ['view', 'create', 'edit', 'approve', 'export'];

async function run() {
  const client = new Client({
    user: DB_USER,
    host: DB_HOST,
    port: DB_PORT,
    password: DB_PASSWORD,
    database: DB_NAME,
  });
  await client.connect();

  try {
    console.log('Seeding roles...');
    await client.query(`
      INSERT INTO "roles" ("name", "label", "color", "is_system", "description")
      VALUES
        ('superadmin', 'Super Admin', '#0d1b4b', true, 'Full access to all modules and user management'),
        ('admin', 'Admin', '#e05470', true, 'Administrative access with user management')
      ON CONFLICT ("name") DO NOTHING
    `);

    console.log('Seeding modules...');
    for (const mod of MODULES) {
      await client.query(
        `INSERT INTO "modules" ("id", "label") VALUES ($1, $2) ON CONFLICT ("id") DO NOTHING`,
        [mod.id, mod.label],
      );
    }

    console.log('Seeding permissions...');
    for (const perm of PERMISSIONS) {
      await client.query(
        `INSERT INTO "permissions" ("action", "label", "description") VALUES ($1, $2, $3) ON CONFLICT ("action") DO NOTHING`,
        [perm.action, perm.label, perm.description],
      );
    }

    const { rows: roleRows } = await client.query(
      `SELECT "id", "name" FROM "roles" WHERE "name" IN ('superadmin', 'admin')`,
    );
    const superadminId = roleRows.find(r => r.name === 'superadmin').id;
    const adminId = roleRows.find(r => r.name === 'admin').id;

    const { rows: allPerms } = await client.query(`SELECT "id", "action" FROM "permissions"`);

    console.log('Seeding role_permissions...');
    for (const mod of MODULES) {
      for (const perm of allPerms) {
        await client.query(
          `INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [superadminId, mod.id, perm.id],
        );
      }
      for (const perm of allPerms.filter(p => ADMIN_ACTIONS.includes(p.action))) {
        await client.query(
          `INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [adminId, mod.id, perm.id],
        );
      }
    }

    console.log('Seeding superadmin user...');
    await client.query(
      `INSERT INTO "users" ("email", "role_id", "user_type", "name", "initials", "avatar_color", "status")
       VALUES ('admin@southlake.com', $1, 'staff', 'Super Admin', 'SA', '#0d1b4b', 'active')
       ON CONFLICT ("email") DO NOTHING`,
      [superadminId],
    );

    console.log(`\nDone — "${DB_NAME}" seeded successfully.`);
  } finally {
    await client.end();
  }
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
