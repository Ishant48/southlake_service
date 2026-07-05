import { Injectable } from '@nestjs/common';
import { Workbook } from '../entities/workbook.entity';
import { WorkbookLookupsDao } from './dao/workbook-lookups.dao';

/** Internal helpers for locating a workbook's baseline/predecessor workbook (previous month, or the program's ITD baseline); used by fut-reserves and reports. */
@Injectable()
export class WorkbookLookupsService {
  constructor(private readonly dao: WorkbookLookupsDao) {}

  async findPreviousWorkbook(
    program: string,
    monthKey: string,
    source: string,
  ): Promise<Workbook | null> {
    return this.dao.findByProgramMonthSource(program, monthKey, source);
  }

  async findPreviousWorkbookFor(workbook: Workbook): Promise<Workbook | null> {
    // 1. If it's January (monthKey ends with '-01'), look for ITD source workbook for the same program
    if (workbook.monthKey.endsWith('-01')) {
      const itdWb = await this.dao.findLatestByProgramSource(workbook.program, 'ITD');
      if (itdWb) return itdWb;
    }

    // 2. Otherwise, find workbook of the same program, same source, for the previous month key
    const prevMonthKey = this.getPreviousMonthKey(workbook.monthKey);
    let prevWb = await this.dao.findByProgramMonthSource(
      workbook.program,
      prevMonthKey,
      workbook.source,
    );
    if (prevWb) return prevWb;

    // 3. Fallback: try to find any source workbook for the previous month key
    prevWb = await this.dao.findLatestByProgramMonth(workbook.program, prevMonthKey);
    if (prevWb) return prevWb;

    // 4. Fallback 2: if it's not January, but we are a FUT/Starlight workbook and have no other previous workbook,
    // default to the program's ITD workbook as the ultimate baseline
    if (workbook.source !== 'ITD') {
      const itdWb = await this.dao.findLatestByProgramSource(workbook.program, 'ITD');
      if (itdWb) return itdWb;
    }

    return null;
  }

  private getPreviousMonthKey(monthKey: string): string {
    const parts = monthKey.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}
