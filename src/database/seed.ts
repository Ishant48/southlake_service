import { AppDataSource } from './data-source';
import { seedRoles } from './seed-roles';
import { seedPermissions } from './seed-permissions';
import { seedCoa } from './seed-coa';
import { seedFalconData } from './seed-falcon-data';
import { seedGlMappings } from './seed-gl-mappings';
import { seedDocumentTypes } from './seed-document-types';

/**
 * Single entry point for all repeatable fixture seeding — run via `npm run seed`.
 * Runs every seed in one transaction, in dependency order (permissions/roles
 * before COA, COA before Falcon master data which references it). Each
 * individual seed function is idempotent (existence-checked inserts), so
 * this is safe to re-run against an already-seeded database.
 *
 * Not included here: seed-journal-entries.ts, which is a one-time ETL from
 * an external legacy database, not a repeatable fixture — run separately
 * via `npm run migrate:from-starlight` when that source system is reachable.
 */
async function seed(): Promise<void> {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.warn('Seeding roles and superadmin user...');
    await seedRoles(queryRunner);

    console.warn('Seeding permissions...');
    await seedPermissions(queryRunner);

    console.warn('Seeding chart of accounts...');
    await seedCoa(queryRunner);

    console.warn('Seeding Falcon master data (states, LOBs, COBs, risk companies)...');
    await seedFalconData(queryRunner);

    console.warn('Seeding GL Mappings...');
    await seedGlMappings(queryRunner);

    console.warn('Seeding Document Types...');
    await seedDocumentTypes(queryRunner);

    await queryRunner.commitTransaction();
    console.warn('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed, rolling back...', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
