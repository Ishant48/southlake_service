#!/usr/bin/env node
'use strict';

/**
 * Terminates all active DB connections, drops the database, recreates it,
 * then runs TypeORM migrations. Reads connection info from environment variables
 * (loaded via dotenv-cli before this script runs).
 *
 * Usage:
 *   dotenv -e .env.development -- node scripts/db-reset.js
 *   dotenv -e .env.test        -- node scripts/db-reset.js
 */

const { Client } = require('pg');
const { execSync } = require('child_process');

const DB_NAME = process.env.DATABASE_NAME;
const DB_USER = process.env.DATABASE_USER;
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DATABASE_PORT || '5432', 10);
const DB_PASSWORD = process.env.DATABASE_PASSWORD || undefined;

if (!DB_NAME || !DB_USER) {
  console.error('Missing DATABASE_NAME or DATABASE_USER env vars');
  process.exit(1);
}

async function run() {
  const client = new Client({
    user: DB_USER,
    host: DB_HOST,
    port: DB_PORT,
    password: DB_PASSWORD,
    database: 'postgres',
  });

  try {
    await client.connect();

    console.log(`Terminating connections to "${DB_NAME}"...`);
    await client.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [DB_NAME],
    );

    console.log(`Dropping "${DB_NAME}"...`);
    await client.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);

    console.log(`Creating "${DB_NAME}"...`);
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
  } finally {
    await client.end();
  }

  console.log('Running migrations...');
  execSync(
    'ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli migration:run -d src/database/data-source.ts',
    { stdio: 'inherit', cwd: process.cwd() },
  );

  console.log(`\nDone — "${DB_NAME}" is fresh with all migrations applied.`);
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
