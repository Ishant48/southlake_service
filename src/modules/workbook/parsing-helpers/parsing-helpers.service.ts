import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

/** Generic, program-agnostic helpers for locating rows/columns and parsing values in uploaded XLSX sheets; shared by the Starlight and FUT parsers. */
@Injectable()
export class ParsingHelpersService {
  findRowIndexByLabel(sheet: XLSX.WorkSheet, labelSubstr: string): number {
    const ref = sheet['!ref'];
    if (!ref) return -1;
    const range = XLSX.utils.decode_range(ref);
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c: 1 })] as XLSX.CellObject | undefined; // Column B
      if (cell?.v && String(cell.v).toLowerCase().includes(labelSubstr.toLowerCase())) {
        return r;
      }
    }
    return -1;
  }

  findRowIndexByExactLabel(sheet: XLSX.WorkSheet, labelStr: string): number {
    const ref = sheet['!ref'];
    if (!ref) return -1;
    const range = XLSX.utils.decode_range(ref);
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c: 1 })] as XLSX.CellObject | undefined; // Column B
      if (cell?.v && String(cell.v).trim().toLowerCase() === labelStr.toLowerCase()) {
        return r;
      }
    }
    return -1;
  }

  findHeaderRowAndMonths(
    sheet: XLSX.WorkSheet,
  ): { headerRowIdx: number; months: { colIdx: number; monthName: string }[] } | null {
    const ref = sheet['!ref'];
    if (!ref) return null;
    const range = XLSX.utils.decode_range(ref);
    for (let r = range.s.r; r <= Math.min(10, range.e.r); r++) {
      const cols: { colIdx: number; monthName: string }[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
        if (cell?.v && String(cell.v).match(/^[A-Za-z]{3}-\d{2}$/)) {
          cols.push({ colIdx: c, monthName: String(cell.v) });
        }
      }
      if (cols.length > 0) {
        return { headerRowIdx: r, months: cols };
      }
    }
    return null;
  }

  getNumericValue(sheet: XLSX.WorkSheet, r: number, c: number): number {
    if (r < 0 || c === null || c === undefined) return 0.0;
    const cell = sheet[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
    if (!cell) return 0.0;
    if (typeof cell.v === 'number') return cell.v;
    if (cell.v !== undefined && cell.v !== null) {
      const clean = parseFloat(String(cell.v).replace(/[^0-9.-]/g, ''));
      return isNaN(clean) ? 0.0 : clean;
    }
    return 0.0;
  }

  getFUTReportDate(workbook: XLSX.WorkBook): Date | null {
    const stateSheetName = workbook.SheetNames.find(
      name => name.trim().match(/^MTHLY-([A-Z]{2})$/i) && name.trim() !== 'MTHLY-TOTAL',
    );
    if (stateSheetName) {
      const sheet = workbook.Sheets[stateSheetName];
      const cell = sheet['C4'] as XLSX.CellObject | undefined;
      if (cell?.v) {
        const parsed = this.parseDateValue(cell.v);
        if (parsed) return parsed;
      }
    }
    const csSheet = workbook.Sheets['Cash Settlement'];
    if (csSheet) {
      const cell = csSheet['C9'] as XLSX.CellObject | undefined;
      if (cell?.v) {
        const parsed = this.parseDateValue(cell.v);
        if (parsed) return parsed;
      }
    }
    return null;
  }

  parseDateValue(val: string | number | boolean | Date | undefined | null): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') {
      return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    const str = String(val).trim();
    const matchMonthYearStr = str.match(/^([A-Za-z]+)-(\d{2})$/);
    if (matchMonthYearStr) {
      const months: Record<string, number> = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const mStr = matchMonthYearStr[1].toLowerCase().substring(0, 3);
      const yStr = matchMonthYearStr[2];
      const m = months[mStr];
      if (m !== undefined) {
        const year = parseInt(yStr) + (parseInt(yStr) < 50 ? 2000 : 1900);
        return new Date(year, m, 15);
      }
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    return null;
  }

  formatMonthKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  formatMonthLabel(date: Date): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  parseDateToMonthKey(str: string): string {
    if (!str) return '';
    const cleanStr = String(str).trim();
    const match = cleanStr.match(/^([A-Za-z]{3})-(\d{2})$/);
    if (match) {
      const months: Record<string, string> = {
        jan: '01',
        feb: '02',
        mar: '03',
        apr: '04',
        may: '05',
        jun: '06',
        jul: '07',
        aug: '08',
        sep: '09',
        oct: '10',
        nov: '11',
        dec: '12',
      };
      const m = months[match[1].toLowerCase()];
      if (m) {
        const year = '20' + match[2];
        return `${year}-${m}`;
      }
    }
    return '';
  }

  getNextMonthKey(monthKey: string): string {
    const parts = monthKey.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  getPrevMonthKey(monthKey: string): string {
    const parts = monthKey.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}
