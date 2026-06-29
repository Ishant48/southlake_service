import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TestBalanceService {
  constructor(private dataSource: DataSource) {}

  async getTestBalance(month: string = 'June', year: number = 2026) {
    const periodStr = `${month} ${year}`;
    
    // 1. Fetch journal entry summaries for the period grouped by account code
    const query = `
      SELECT 
        c.account_code::varchar as account_code,
        COALESCE(SUM(e.debit), 0) as total_debit,
        COALESCE(SUM(e.credit), 0) as total_credit
      FROM journal_entries e
      JOIN chart_of_accounts c ON e.coa_id = c.id
      JOIN journal_entry_batches b ON e.batch_id = b.id
      WHERE b.period = $1 OR b.period = $2
      GROUP BY c.account_code
    `;
    
    const monthNum = month === 'June' ? '06' : '01'; // support basic month fallback if needed
    const altPeriodStr = `${monthNum}-${year}`;
    const dbRes = await this.dataSource.query(query, [periodStr, altPeriodStr]);
    
    const dbMap = new Map<string, { total_debit: number; total_credit: number }>();
    for (const row of dbRes) {
      dbMap.set(row.account_code, {
        total_debit: Number(row.total_debit),
        total_credit: Number(row.total_credit),
      });
    }

    // 2. Define baseline mockup data (excluding GL)
    const accounts = [
      {
        code: '210001',
        name: 'ACCOUNT PAYABLE - 210001',
        type: 'AP',
        status: 'AP Active',
        bg_balance: -50242296.00,
        rows: [
          { type: 'IN', p_balance: -4292432.19, c_balance: -4292432.19, difference: 0.00 },
          { type: 'CR', p_balance: 0.00, c_balance: 0.00, difference: 0.00 },
          { type: 'CK', p_balance: 267.00, c_balance: 267.00, difference: 0.00 },
          { type: 'JE', p_balance: 0.00, c_balance: 0.00, difference: 0.00 }
        ]
      },
      {
        code: '110019',
        name: 'ACCOUNT RECEIVABLE (DIRECT BILLING) - 110019',
        type: 'AR_DB',
        status: '',
        bg_balance: 153683.19,
        rows: [
          { type: 'IN', p_balance: 67867.58, c_balance: 67867.58, difference: 0.00 },
          { type: 'CR', p_balance: -150177.27, c_balance: -150177.27, difference: 0.00 },
          { type: 'CK', p_balance: 0.00, c_balance: 0.00, difference: 0.00 },
          { type: 'JE', p_balance: 0.00, c_balance: 0.00, difference: 0.00 }
        ]
      },
      {
        code: '110001',
        name: 'ACCOUNT RECEIVABLE - 110001',
        type: 'AR',
        status: 'AR Active',
        bg_balance: 32068180.40,
        rows: [
          { type: 'IN', p_balance: 4746263.67, c_balance: 4746263.67, difference: 0.00 },
          { type: 'CR', p_balance: -4287244.82, c_balance: -4287244.82, difference: 0.00 },
          { type: 'CK', p_balance: 3779.26, c_balance: 3779.26, difference: 0.00 },
          { type: 'JE', p_balance: 0.00, c_balance: 0.00, difference: 0.00 }
        ]
      }
    ];

    // 3. Merge dynamic database entries
    for (const acc of accounts) {
      const dbEntry = dbMap.get(acc.code);
      const jeRow = acc.rows.find(r => r.type === 'JE');
      if (jeRow && dbEntry) {
        if (acc.type === 'AP') {
          // Normal balance is Credit (so Credit is positive, Debit is negative)
          jeRow.p_balance = dbEntry.total_debit || dbEntry.total_credit; 
          jeRow.c_balance = dbEntry.total_credit - dbEntry.total_debit;
        } else {
          // Normal balance is Debit (so Debit is positive, Credit is negative)
          jeRow.p_balance = dbEntry.total_debit || dbEntry.total_credit;
          jeRow.c_balance = dbEntry.total_debit - dbEntry.total_credit;
        }
      }
      
      // Calculate current balance: BG + sum of C balances
      const sumC = acc.rows.reduce((sum, r) => sum + r.c_balance, 0);
      (acc as any).current_balance = acc.bg_balance + sumC;
    }

    return {
      month,
      year,
      status: 'Month Active',
      accounts
    };
  }
}
