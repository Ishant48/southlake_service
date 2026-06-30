import { AppDataSource } from './data-source';
import { Client } from 'pg';

export async function seedJournalEntries(): Promise<void> {
  const isInitialized = AppDataSource.isInitialized;
  if (!isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  // Connect to starlight db
  const starlightClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'starlight',
    user: 'postgres',
    password: 'Rohitpk27',
  });

  try {
    await starlightClient.connect();
    console.log('Connected to starlight database. Fetching journal entries...');

    const res = await starlightClient.query('SELECT * FROM journal_entries ORDER BY id ASC');
    const rows = res.rows;
    console.log(`Fetched ${rows.length} rows from starlight.journal_entries.`);

    if (rows.length === 0) {
      console.log('No rows to seed.');
      await queryRunner.commitTransaction();
      return;
    }

    // 0. Ensure Futuristic Underwriters LLC MGA exists in mga_master
    console.log('Checking Futuristic Underwriters LLC MGA...');
    const resMGA = await queryRunner.query(
      "SELECT id FROM mga_master WHERE name = 'Futuristic Underwriters LLC' OR mga_code = 'MGA-100'"
    );
    if (resMGA.length === 0) {
      console.log('Inserting Futuristic Underwriters LLC MGA...');
      await queryRunner.query(`
        INSERT INTO mga_master (mga_code, name, tax_payable_inhouse, is_active, ledger_amount)
        VALUES ('MGA-100', 'Futuristic Underwriters LLC', false, true, 0.00)
      `);
    } else {
      await queryRunner.query(
        "UPDATE mga_master SET name = 'Futuristic Underwriters LLC', mga_code = 'MGA-100' WHERE id = $1",
        [resMGA[0].id]
      );
    }

    // Clear existing journal entries and batches in southlake to start fresh
    console.log('Clearing existing journal entries and batches in southlake...');
    await queryRunner.query('DELETE FROM journal_entries');
    await queryRunner.query('DELETE FROM journal_entry_batches');

    // Group rows by journal_no (batch)
    const batchesMap = new Map<string, any[]>();
    for (const row of rows) {
      const batchNo = row.journal_no || 'UNKNOWN';
      if (!batchesMap.has(batchNo)) {
        batchesMap.set(batchNo, []);
      }
      batchesMap.get(batchNo)!.push(row);
    }

    console.log(`Grouped into ${batchesMap.size} batches.`);

    // Parent Account mapping cache
    const parentAccounts: Record<number, string> = {};
    const rootCodes = [110000, 210000, 310000, 410000, 510000];
    for (const code of rootCodes) {
      const resVal = await queryRunner.query('SELECT id FROM chart_of_accounts WHERE account_code = $1', [code]);
      if (resVal.length > 0) {
        parentAccounts[code] = resVal[0].id;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (const [batchNo, lines] of batchesMap.entries()) {
      // Calculate batch stats
      const firstLine = lines[0];
      
      // Period string conversion from e.g. "Jan-26" or "June 2026"
      let period = firstLine.period || 'June 2026';
      if (period === 'Jan-26') period = 'January 2026';
      else if (period === 'Feb-26') period = 'February 2026';
      else if (period === 'Mar-26') period = 'March 2026';
      else if (period === 'Apr-26') period = 'April 2026';
      else if (period === 'May-26') period = 'May 2026';
      else if (period === 'Jun-26') period = 'June 2026';
      else if (period === 'Jul-26') period = 'July 2026';
      else if (period === 'Aug-26') period = 'August 2026';
      else if (period === 'Sep-26') period = 'September 2026';
      else if (period === 'Oct-26') period = 'October 2026';
      else if (period === 'Nov-26') period = 'November 2026';
      else if (period === 'Dec-26') period = 'December 2026';

      let totalAmount = 0;
      for (const line of lines) {
        const d = Number(line.debit) || 0;
        totalAmount += d;
      }

      // Create batch record
      const insertBatch = await queryRunner.query(
        `INSERT INTO journal_entry_batches (batch_number, period, agent_name, total_amount, count)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [batchNo, period, 'Futuristic Underwriters LLC', totalAmount, lines.length]
      );
      const batchId = insertBatch[0].id;

      // Seed lines with balanced je_number grouping
      let jeNumber = 1;
      let runningSum = 0;

      for (const line of lines) {
        const glCode = Number(line.account_code);
        if (!glCode) continue;

        // Find/create coa_id
        let coaId;
        const resCoa = await queryRunner.query('SELECT id FROM chart_of_accounts WHERE account_code = $1', [glCode]);
        if (resCoa.length > 0) {
          coaId = resCoa[0].id;
        } else {
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
            `INSERT INTO chart_of_accounts (account_code, description, parent_id, normal_balance, is_parent, is_active)
             VALUES ($1, $2, $3, $4, false, true)
             RETURNING id`,
            [glCode, line.account_name || `GL ${glCode}`, parentId, normalBalance]
          );
          coaId = insertCoa[0].id;
        }

        // Parse date DD/MM/YYYY to YYYY-MM-DD
        let dateStr = todayStr;
        if (line.date) {
          const parts = line.date.split('/');
          if (parts.length === 3) {
            dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }

        const debitVal = line.debit ? Number(line.debit) : 0;
        const creditVal = line.credit ? Number(line.credit) : 0;

        await queryRunner.query(
          `INSERT INTO journal_entries (batch_id, je_number, description, coa_id, sub, debit, credit, date, dp, policy, memo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            batchId,
            jeNumber,
            line.description || 'Starlight Entry',
            coaId,
            line.sub || null,
            debitVal > 0 ? debitVal : null,
            creditVal > 0 ? creditVal : null,
            dateStr,
            `${line.cc || '00'}-${line.mga || '0000'}-${line.lob || '000000'}-${line.state || '00'}-${line.ext || '0000'}`,
            line.lob || null,
            line.account_name || 'Starlight line'
          ]
        );

        // Update running balance to determine balanced JE boundaries
        runningSum += (debitVal - creditVal);
        if (Math.abs(runningSum) < 0.01) {
          runningSum = 0;
          jeNumber++;
        }
      }

      // Update count of JEs in batch
      await queryRunner.query(
        `UPDATE journal_entry_batches SET count = $1 WHERE id = $2`,
        [jeNumber - 1 || 1, batchId]
      );
    }

    await queryRunner.commitTransaction();
    console.log('Successfully completed migrating starlight data to southlake!');
  } catch (err: any) {
    console.error('Error during migration seeder:', err);
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await starlightClient.end();
    await queryRunner.release();
    if (!isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedJournalEntries()
    .then(() => {
      console.log('Seeder run completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeder failed:', err);
      process.exit(1);
    });
}
