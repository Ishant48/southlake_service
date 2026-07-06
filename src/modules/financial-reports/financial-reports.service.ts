import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface FinancialLedgerRow {
  accountCode: string;
  description: string;
  parentKey: string | null;
  normalBalance: string;
  totalDebit: string | number;
  totalCredit: string | number;
}

export interface FinancialLineItem {
  accountCode: string;
  description: string;
  balance: number;
}

interface BatchPeriodRow {
  period: string;
}

const MONTHS_LIST = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

function parsePeriod(period: string): { year: number; month: number } {
  const p = period.toLowerCase().trim();
  for (let i = 0; i < 12; i++) {
    if (p.includes(MONTHS_LIST[i])) {
      const yearMatch = p.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : 2026;
      return { year, month: i };
    }
  }
  const parts = p.split('-');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(y)) {
      return { year: y, month: m - 1 };
    }
  }
  throw new BadRequestException(
    `Unrecognized period format: "${period}". Expected a month name (e.g. "June 2026") or "MM-YYYY".`,
  );
}

function tryParsePeriod(period: string): { year: number; month: number } | null {
  try {
    return parsePeriod(period);
  } catch {
    return null;
  }
}

/** periodA is untrusted (a batch's stored period), periodB is the already-validated target period. */
function isPeriodBeforeOrEqual(periodA: string, periodB: { year: number; month: number }): boolean {
  const a = tryParsePeriod(periodA);
  if (!a) return false;
  if (a.year !== periodB.year) {
    return a.year < periodB.year;
  }
  return a.month <= periodB.month;
}

@Injectable()
export class FinancialReportsService {
  private readonly logger = new Logger(FinancialReportsService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getPLStatement(period: string) {
    // Profit & Loss is for a specific period
    const query = `
      SELECT 
        c.account_code as "accountCode",
        c.description as "description",
        p.key as "parentKey",
        c.normal_balance as "normalBalance",
        COALESCE(SUM(e.debit), 0) as "totalDebit",
        COALESCE(SUM(e.credit), 0) as "totalCredit"
      FROM journal_entries e
      JOIN chart_of_accounts c ON e.coa_id = c.id
      JOIN chart_of_accounts p ON c.parent_id = p.id
      JOIN journal_entry_batches b ON e.batch_id = b.id
      WHERE b.period = $1 OR b.period = $2
      GROUP BY c.account_code, c.description, p.key, c.normal_balance
      ORDER BY c.account_code ASC
    `;

    const parsed = parsePeriod(period);
    const altPeriod = `${String(parsed.month + 1).padStart(2, '0')}-${parsed.year}`;
    const dbRes: FinancialLedgerRow[] = await this.dataSource.query(query, [period, altPeriod]);

    let totalRevenue = 0;
    let totalExpense = 0;
    const revenues: FinancialLineItem[] = [];
    const expenses: FinancialLineItem[] = [];
    const unclassified: string[] = [];

    for (const row of dbRes) {
      const debit = Number(row.totalDebit);
      const credit = Number(row.totalCredit);
      const parentKey = row.parentKey ?? '';

      let balance = 0;
      if (row.normalBalance === 'credit') {
        balance = credit - debit;
      } else {
        balance = debit - credit;
      }

      const item = {
        accountCode: row.accountCode,
        description: row.description,
        balance,
      };

      if (parentKey === 'REVENUE' || String(row.accountCode).startsWith('4')) {
        revenues.push(item);
        totalRevenue += balance;
      } else if (
        parentKey === 'EXPANSE' ||
        String(row.accountCode).startsWith('5') ||
        String(row.accountCode).startsWith('6') ||
        String(row.accountCode).startsWith('9')
      ) {
        expenses.push(item);
        totalExpense += balance;
      } else {
        unclassified.push(row.accountCode);
      }
    }

    if (unclassified.length > 0) {
      this.logger.warn(
        `P&L for period "${period}": ${unclassified.length} account(s) matched neither REVENUE nor EXPANSE buckets and were excluded: ${unclassified.join(', ')}`,
      );
    }

    const netIncome = totalRevenue - totalExpense;

    return {
      period,
      totalRevenue,
      totalExpense,
      netIncome,
      revenues,
      expenses,
    };
  }

  async getBalanceSheet(period: string) {
    const targetPeriod = parsePeriod(period);

    // Balance Sheet is cumulative: all batches up to and including the target period
    const allBatches: BatchPeriodRow[] = await this.dataSource.query(`
      SELECT DISTINCT period FROM journal_entry_batches
    `);

    const validPeriods: string[] = [];
    for (const b of allBatches) {
      if (!tryParsePeriod(b.period)) {
        this.logger.warn(
          `Balance sheet: skipping journal_entry_batches.period "${b.period}" — unrecognized format`,
        );
        continue;
      }
      if (isPeriodBeforeOrEqual(b.period, targetPeriod)) {
        validPeriods.push(b.period);
      }
    }

    if (validPeriods.length === 0) {
      // Return empty categories if no data
      return {
        period,
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        assets: [],
        liabilities: [],
        equity: [],
      };
    }

    // TypeORM supports ANY($1) for array parameters
    const dbRes: FinancialLedgerRow[] = await this.dataSource.query(
      `SELECT
        c.account_code as "accountCode",
        c.description as "description",
        p.key as "parentKey",
        c.normal_balance as "normalBalance",
        COALESCE(SUM(e.debit), 0) as "totalDebit",
        COALESCE(SUM(e.credit), 0) as "totalCredit"
      FROM journal_entries e
      JOIN chart_of_accounts c ON e.coa_id = c.id
      JOIN chart_of_accounts p ON c.parent_id = p.id
      JOIN journal_entry_batches b ON e.batch_id = b.id
      WHERE b.period = ANY($1)
      GROUP BY c.account_code, c.description, p.key, c.normal_balance
      ORDER BY c.account_code ASC`,
      [validPeriods],
    );

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    const assets: FinancialLineItem[] = [];
    const liabilities: FinancialLineItem[] = [];
    const equity: FinancialLineItem[] = [];

    // Cumulative Revenue & Expense up to this period forms Retained Earnings
    let cumulativeRevenue = 0;
    let cumulativeExpense = 0;
    const unclassified: string[] = [];

    for (const row of dbRes) {
      const debit = Number(row.totalDebit);
      const credit = Number(row.totalCredit);
      const parentKey = row.parentKey ?? '';

      let balance = 0;
      if (row.normalBalance === 'credit') {
        balance = credit - debit;
      } else {
        balance = debit - credit;
      }

      const item = {
        accountCode: row.accountCode,
        description: row.description,
        balance,
      };

      if (parentKey === 'ASSETS' || String(row.accountCode).startsWith('1')) {
        assets.push(item);
        totalAssets += balance;
      } else if (parentKey === 'LIABILITY' || String(row.accountCode).startsWith('2')) {
        liabilities.push(item);
        totalLiabilities += balance;
      } else if (parentKey === 'CAPITAL_AND_EQUITY' || String(row.accountCode).startsWith('3')) {
        equity.push(item);
        totalEquity += balance;
      } else if (parentKey === 'REVENUE' || String(row.accountCode).startsWith('4')) {
        cumulativeRevenue += balance;
      } else if (
        parentKey === 'EXPANSE' ||
        String(row.accountCode).startsWith('5') ||
        String(row.accountCode).startsWith('6') ||
        String(row.accountCode).startsWith('9')
      ) {
        cumulativeExpense += balance;
      } else {
        unclassified.push(row.accountCode);
      }
    }

    if (unclassified.length > 0) {
      this.logger.warn(
        `Balance sheet for period "${period}": ${unclassified.length} account(s) matched no known bucket and were excluded (Assets may not equal Liabilities + Equity): ${unclassified.join(', ')}`,
      );
    }

    // Add Retained Earnings (Net Income cumulative) to Equity
    const retainedEarnings = cumulativeRevenue - cumulativeExpense;
    if (retainedEarnings !== 0) {
      equity.push({
        accountCode: '399999',
        description: 'Retained Earnings (Net Income Cumulative)',
        balance: retainedEarnings,
      });
      totalEquity += retainedEarnings;
    }

    return {
      period,
      totalAssets,
      totalLiabilities,
      totalEquity,
      assets,
      liabilities,
      equity,
    };
  }
}
