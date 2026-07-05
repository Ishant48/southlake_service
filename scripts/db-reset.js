#!/usr/bin/env node
/* global require, process, console */
'use strict';

/**
 * Terminates all active DB connections, drops the database, recreates it,
 * then runs TypeORM migrations. Reads connection info from environment
 * variables (loaded via dotenv before this script runs, e.g. `npm run
 * db:reset` -> `node -r dotenv/config scripts/db-reset.js`).
 *
 * Usage:
 *   npm run db:reset
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

  await client.connect();

  console.warn(`Terminating active connections to "${DB_NAME}"...`);
  await client.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [DB_NAME],
  );

  console.warn(`Dropping database "${DB_NAME}"...`);
  await client.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);

  console.warn(`Creating database "${DB_NAME}"...`);
  await client.query(`CREATE DATABASE "${DB_NAME}"`);

  await client.end();

  console.warn('Running migrations...');
  execSync('npm run migration:run', { stdio: 'inherit' });

  console.warn('Database reset complete.');
}

run().catch(err => {
  console.error('db-reset failed:', err);
  process.exit(1);
});
