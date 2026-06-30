const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'seed-falcon-data.ts');
const content = fs.readFileSync(srcPath, 'utf8');

// Match const BATCHES = [ ... ];
const batchesMatch = content.match(/const BATCHES = (\[[\s\S]*?\]);/);
// Match const ENTRIES = [ ... ];
const entriesMatch = content.match(/const ENTRIES = (\[[\s\S]*?\]);/);

if (!batchesMatch || !entriesMatch) {
  console.error('Failed to parse arrays');
  process.exit(1);
}

const batchesStr = batchesMatch[1];
const entriesStr = entriesMatch[1];

// We will overwrite seed-journal-entries.ts to use these extracted arrays
const targetPath = path.join(__dirname, 'seed-journal-entries.ts');

const newContent = `import { AppDataSource } from './data-source';

const BATCHES = ${batchesStr};

const ENTRIES = ${entriesStr};

export async function seedJournalEntries(): Promise<void> {
  const isInitialized = AppDataSource.isInitialized;
  if (!isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Connected to database. Seeding extracted Falcon Batches & Entries...');

    // Parent Account mapping cache in target
    const parentAccounts = {};
    const rootCodes = [110000, 210000, 310000, 410000, 510000];
    for (const code of rootCodes) {
      const res = await queryRunner.query('SELECT id FROM chart_of_accounts WHERE account_code = $1', [code]);
      if (res.length > 0) {
        parentAccounts[code] = res[0].id;
      }
    }

    const batchIdMap = new Map(); // maps source batch ID to target batch UUID

    for (const b of BATCHES) {
      let batchId;
      const exists = await queryRunner.query('SELECT id FROM journal_entry_batches WHERE batch_number = $1', [b.batch_number]);
      
      if (exists.length > 0) {
        batchId = exists[0].id;
      } else {
        const insertBatch = await queryRunner.query(
          \`INSERT INTO journal_entry_batches (batch_number, period, agent_name, total_amount, count)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id\`,
          [b.batch_number, b.period, b.agent_name, b.total_amount, b.count]
        );
        batchId = insertBatch[0].id;
      }
      batchIdMap.set(b.id, batchId);
    }

    // Seed Entries
    for (const e of ENTRIES) {
      const targetBatchId = batchIdMap.get(e.batch_id);
      if (!targetBatchId) continue;

      const glCode = Number(e.account_code);
      
      // Lookup coa_id
      let coaId;
      const resCoa = await queryRunner.query('SELECT id FROM chart_of_accounts WHERE account_code = $1', [glCode]);
      if (resCoa.length > 0) {
        coaId = resCoa[0].id;
      } else {
        // Dynamically seed missing G/L Account
        let parentCode = 110000;
        let normalBalance = 'debit';
        
        if (glCode >= 200000 && glCode < 300000) {
          parentCode = 210000;
          normalBalance = 'credit';
        } else if (glCode >= 300000 && glCode < 400000) {
          parentCode = 310000;
          normalBalance = 'credit';
        } else if (glCode >= 400000 && glCode < 500000) {
          parentCode = 410000;
          normalBalance = 'credit';
        } else if (glCode >= 500000 && glCode < 600000) {
          parentCode = 510000;
          normalBalance = 'debit';
        }

        const parentId = parentAccounts[parentCode] || null;

        const insertCoa = await queryRunner.query(
          \`INSERT INTO chart_of_accounts (account_code, description, parent_id, normal_balance, is_parent, is_active)
           VALUES ($1, $2, $3, $4, false, true)
           RETURNING id\`,
          [glCode, \`GL \${glCode} (Imported)\`, parentId, normalBalance]
        );
        coaId = insertCoa[0].id;
      }

      // Format Date
      const dateStr = typeof e.date === 'string' ? e.date.split('T')[0] : new Date().toISOString().split('T')[0];

      // Check duplicate entry line if already exists
      const checkEntry = await queryRunner.query(
        \`SELECT id FROM journal_entries 
         WHERE batch_id = $1 AND je_number = $2 AND description = $3 AND coa_id = $4 AND date = $5\`,
        [
          targetBatchId,
          e.je_number,
          e.description,
          coaId,
          dateStr
        ]
      );

      if (checkEntry.length === 0) {
        await queryRunner.query(
          \`INSERT INTO journal_entries 
           (batch_id, je_number, description, coa_id, sub, debit, credit, date, dp, policy, memo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)\`,
          [
            targetBatchId,
            e.je_number,
            e.description,
            coaId,
            e.sub,
            e.debit ? Number(e.debit) : null,
            e.credit ? Number(e.credit) : null,
            dateStr,
            e.dp,
            e.policy,
            e.memo
          ]
        );
      }
    }

    await queryRunner.commitTransaction();
    console.log('Seeding finished successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
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
`;

fs.writeFileSync(targetPath, newContent, 'utf8');
console.log('Successfully extracted Falcon batches/entries into seed-journal-entries.ts!');
