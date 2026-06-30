import { AppDataSource } from './data-source';

export async function seedJournalEntries(): Promise<void> {
  const isInitialized = AppDataSource.isInitialized;
  if (!isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Connected to database. Seeding Journal Entries batch 1246502...');

    // 1. Rename MGA to Futuristic Underwriters LLC
    console.log('Renaming MGA...');
    await queryRunner.query(
      "UPDATE mga_master SET name = 'Futuristic Underwriters LLC' WHERE mga_code = 'MGA-100'"
    );

    // 2. Fetch or create COA account 110102
    console.log('Checking accounts...');
    const resAcct = await queryRunner.query(
      "SELECT id FROM chart_of_accounts WHERE account_code = 110102"
    );

    let coaId110102;
    if (resAcct && resAcct.length > 0) {
      coaId110102 = resAcct[0].id;
    } else {
      // Find parent for assets (110000)
      const parentRes = await queryRunner.query("SELECT id FROM chart_of_accounts WHERE account_code = 110000");
      const parentId = parentRes && parentRes.length > 0 ? parentRes[0].id : null;

      // Insert account 110102
      console.log('Inserting mock account 110102...');
      const insertCoa = await queryRunner.query(`
        INSERT INTO chart_of_accounts (account_code, description, parent_id, normal_balance, is_parent, is_active)
        VALUES (110102, 'STAMP FEE & TAX CLEARING', ${parentId ? `'${parentId}'` : 'NULL'}, 'debit', false, true)
        RETURNING id
      `);
      coaId110102 = insertCoa[0].id;
    }

    // Fetch account 210001 (ACCOUNT PAYABLE)
    const resAP = await queryRunner.query(
      "SELECT id FROM chart_of_accounts WHERE account_code = 210001"
    );
    const coaId210001 = resAP && resAP.length > 0 ? resAP[0].id : null;

    if (!coaId210001) {
      throw new Error('Required Chart of Account 210001 not found.');
    }

    // 3. Check if batch 1246502 already exists
    const resBatch = await queryRunner.query(
      "SELECT id FROM journal_entry_batches WHERE batch_number = '1246502'"
    );

    let batchId;
    if (resBatch && resBatch.length > 0) {
      batchId = resBatch[0].id;
      // Clear existing entries in the batch to avoid duplicates
      await queryRunner.query("DELETE FROM journal_entries WHERE batch_id = $1", [batchId]);
    } else {
      console.log('Creating batch 1246502...');
      const insertBatch = await queryRunner.query(`
        INSERT INTO journal_entry_batches (batch_number, period, agent_name, total_amount, count)
        VALUES ('1246502', 'June 2026', 'Futuristic Underwriters LLC', 821167.88, 4)
        RETURNING id
      `);
      batchId = insertBatch[0].id;
    }

    // 4. Seed the entries matching mockup 3
    console.log('Seeding journal entries...');
    
    const entries = [
      // Journal 4
      { jeNumber: 4, desc: 'STAMP FEE FEB 2026', coaId: coaId210001, sub: '705', debit: 28610.84, credit: null, policy: 'OP STARTER' },
      { jeNumber: 4, desc: 'STAMP FEE FEB 2026', coaId: coaId110102, sub: null, debit: null, credit: 28610.84, policy: null },
      // Journal 3
      { jeNumber: 3, desc: 'SLA TAX FEB 2026', coaId: coaId210001, sub: '705', debit: 476847.27, credit: null, policy: 'OP STARTER' },
      { jeNumber: 3, desc: 'SLA TAX FEB 2026', coaId: coaId110102, sub: null, debit: null, credit: 476847.27, policy: null },
      // Journal 2
      { jeNumber: 2, desc: 'STAMP FEE JAN 2026', coaId: coaId210001, sub: '705', debit: 17870.36, credit: null, policy: 'OP STARTER' },
      { jeNumber: 2, desc: 'STAMP FEE JAN 2026', coaId: coaId110102, sub: null, debit: null, credit: 17870.36, policy: null },
      // Journal 1
      { jeNumber: 1, desc: 'SLA TAX JAN 2026', coaId: coaId210001, sub: '705', debit: 297839.41, credit: null, policy: 'OP STARTER' },
      { jeNumber: 1, desc: 'SLA TAX JAN 2026', coaId: coaId110102, sub: null, debit: null, credit: 297839.41, policy: null }
    ];

    const todayStr = new Date().toISOString().split('T')[0];

    for (const ent of entries) {
      await queryRunner.query(`
        INSERT INTO journal_entries (batch_id, je_number, description, coa_id, sub, debit, credit, date, dp, policy, memo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        batchId,
        ent.jeNumber,
        ent.desc,
        ent.coaId,
        ent.sub,
        ent.debit,
        ent.credit,
        todayStr,
        '-',
        ent.policy,
        'Auto seeded demo entry'
      ]);
    }

    // Update batch stats
    await queryRunner.query(`
      UPDATE journal_entry_batches
      SET total_amount = 821167.88, count = 4
      WHERE id = $1
    `, [batchId]);

    await queryRunner.commitTransaction();
    console.log('Seeding finished successfully!');
  } catch (err) {
    console.error('Error seeding data, rolling back:', err);
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
    if (!isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedJournalEntries()
    .then(() => {
      console.log('Journal entries seeding completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Journal entries seeding failed:', err);
      process.exit(1);
    });
}
