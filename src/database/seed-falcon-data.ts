import { AppDataSource } from './data-source';
import { QueryRunner } from 'typeorm';
import { seedPermissions } from './seed-permissions';
import { seedCoa } from './seed-coa';
import { STATES } from './seeds/data/states.data';
import { LOBS } from './seeds/data/lobs.data';
import { COBS } from './seeds/data/cobs.data';
import { RISK_COMPANIES } from './seeds/data/risk-companies.data';

export async function seedFalconData(externalQueryRunner?: QueryRunner): Promise<void> {
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
    if (!useExternal) {
      console.warn('Master Seeder: Seeding Permissions...');
      await seedPermissions(queryRunner);

      console.warn('Master Seeder: Seeding Chart of Accounts...');
      await seedCoa(queryRunner);
    }

    // 1. Seed States
    console.warn('Seeding States...');
    for (const s of STATES) {
      const exists = (await queryRunner.query('SELECT id FROM state_master WHERE state_abbr = $1', [
        s.state_abbr,
      ])) as Array<{ id: string }>;
      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO state_master (state_code, state_abbr, name, is_active)
           VALUES ($1, $2, $3, true)`,
          [s.state_code, s.state_abbr, s.name],
        );
      }
    }

    // 2. Seed LOBs
    console.warn('Seeding LOBs...');
    for (const l of LOBS) {
      const exists = (await queryRunner.query(
        'SELECT id FROM lines_of_business WHERE lob_code = $1',
        [l.lob_code],
      )) as Array<{ id: string }>;
      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO lines_of_business (lob_code, name, description, is_active)
           VALUES ($1, $2, $3, true)`,
          [l.lob_code, l.name, l.description],
        );
      }
    }

    // 3. Seed COBs
    console.warn('Seeding COBs...');
    for (const c of COBS) {
      const exists = (await queryRunner.query('SELECT id FROM cob_master WHERE cob_code = $1', [
        c.cob_code,
      ])) as Array<{ id: string }>;
      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO cob_master (cob_code, name, priority, type, fully_earned, taxable, is_active, description)
           VALUES ($1, $2, $3, $4, $5, $6, true, $2)`,
          [c.cob_code, c.name, c.priority, c.type, c.fully_earned, c.taxable],
        );
      }
    }

    // 4. Seed Risk Companies (table renamed to "carriers" — RiskCompany entity maps here)
    console.warn('Seeding Risk Companies...');
    for (const r of RISK_COMPANIES) {
      const exists = (await queryRunner.query('SELECT id FROM carriers WHERE company_id = $1', [
        r.company_id,
      ])) as Array<{ id: string }>;
      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO carriers
           (risk_company_id, company_id, id_name, name, phone, is_admitted, address, city, state, zip, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            r.risk_company_id,
            r.company_id,
            r.id_name,
            r.name,
            r.phone,
            r.is_admitted,
            r.address,
            r.city,
            r.state,
            r.zip,
            r.is_active,
          ],
        );
      }
    }
    // 5. Seed Batches and Entries (Skipped as requested)
    console.warn('Skip seeding Batches & Entries as requested...');

    if (!useExternal) {
      await queryRunner.commitTransaction();
      console.warn('Falcon data seeding transaction committed successfully!');
    }
  } catch (error) {
    console.error('Error during Falcon data seeding, rolling back...', error);
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

// Support running directly from command line
if (require.main === module) {
  seedFalconData()
    .then(() => {
      console.warn('Falcon data seeding completed successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Falcon data seeding failed:', err);
      process.exit(1);
    });
}
