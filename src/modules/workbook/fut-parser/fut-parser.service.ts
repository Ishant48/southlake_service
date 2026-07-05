import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Workbook } from '../entities/workbook.entity';
import { StateExhibit } from '../entities/state-exhibit.entity';
import { CashSettlement } from '../entities/cash-settlement.entity';
import { Treaty } from '../../masters/entities/treaty.entity';
import { ParsingHelpersService } from '../parsing-helpers/parsing-helpers.service';

const STATE_EXHIBIT_FIELDS = [
  'pw',
  'pfw',
  'pc',
  'pfc',
  'tax',
  'lp',
  'laep',
  'ae_paid',
  'pe',
  'pfe',
  'uep',
  'lu',
  'laeu',
  'aeu',
  'loss_reserves',
  'loss_ibnr',
  'lae_reserves_dcc',
  'lae_ibnr_dcc',
  'lae_reserves_aoe',
  'lae_ibnr_aoe',
  'ulae_ibnr',
] as const;

/** Parses FUT-format workbooks (per-state MTHLY-XX sheets + Cash Settlement sheet) into Workbook/StateExhibit/CashSettlement records, and maintains the aggregate TOTAL exhibit shared by FUT and Starlight-derived data. */
@Injectable()
export class FutParserService {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
    @InjectRepository(StateExhibit)
    private readonly stateExhibitRepo: Repository<StateExhibit>,
    @InjectRepository(CashSettlement)
    private readonly cashSettlementRepo: Repository<CashSettlement>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
    private readonly helpers: ParsingHelpersService,
  ) {}

  async parseFUTWorkbook(
    workbook: XLSX.WorkBook,
    filename: string,
    forceOverwrite: boolean = false,
    overrideProgram?: string,
  ) {
    const sheetNames = workbook.SheetNames;
    const fnLower = filename ? filename.toLowerCase() : '';
    let program = 'Excess NX';

    if (fnLower.includes('sam')) {
      program = 'Excess SAM';
    } else if (fnLower.includes('hs')) {
      program = 'Excess HS';
    } else if (fnLower.includes('local')) {
      if (fnLower.includes('mtc')) program = 'MTC Local';
      else program = 'APD Local';
    } else if (fnLower.includes('fleet')) {
      program = 'APD Fleet';
    } else if (fnLower.includes('dpr-apd') || fnLower.includes('drp-apd')) {
      program = 'DPR APD';
    } else if (fnLower.includes('dpr-al') || fnLower.includes('drp-al')) {
      program = 'DPR AL';
    } else if (fnLower.includes('dpr-mtc') || fnLower.includes('drp-mtc')) {
      program = 'DRP MTC';
    } else if (fnLower.includes('mtc')) {
      program = 'DRP MTC';
    } else if (fnLower.includes('al')) {
      program = 'DPR AL';
    } else if (fnLower.includes('dpr') || fnLower.includes('drp')) {
      program = 'DPR APD';
    }

    if (overrideProgram) {
      program = overrideProgram;
    }

    const dbProgram = await this.treatyRepo.findOne({ where: { name: program } });
    const dbRates = dbProgram
      ? {
          comm: dbProgram.commPct !== null ? Number(dbProgram.commPct) : undefined,
          ulae: dbProgram.ulaePct !== null ? Number(dbProgram.ulaePct) : undefined,
          lossPick: dbProgram.ibnrPct !== null ? Number(dbProgram.ibnrPct) : undefined,
          laeDcc: undefined,
          laeAoe: undefined,
          boardsCharge: dbProgram.bbPct !== null ? Number(dbProgram.bbPct) : undefined,
          lossRatioCap: dbProgram.lrCapPct !== null ? Number(dbProgram.lrCapPct) : undefined,
          qs: dbProgram.qsPct !== null ? Number(dbProgram.qsPct) : undefined,
          cf: dbProgram.cfPct !== null ? Number(dbProgram.cfPct) : undefined,
          xol: dbProgram.xolPct !== null ? Number(dbProgram.xolPct) : undefined,
          lr: dbProgram.lrCapPct !== null ? Number(dbProgram.lrCapPct) : undefined,
        }
      : null;

    // Try to parse actuarial rates dynamically from first state sheet (if exists)
    let parsedLossPick: number | undefined;
    let parsedLaeDcc: number | undefined;
    let parsedLaeAoe: number | undefined;

    const stateSheetName = sheetNames.find(
      name => name.trim().length === 2 || name.trim().startsWith('MTHLY-'),
    );
    if (stateSheetName) {
      const stateSheet = workbook.Sheets[stateSheetName];
      const lpRow = this.helpers.findRowIndexByExactLabel(stateSheet, 'Loss Pick');
      const dccRow = this.helpers.findRowIndexByExactLabel(stateSheet, 'LAE - DCC');
      const aoeRow = this.helpers.findRowIndexByExactLabel(stateSheet, 'LAE - AOE');

      // Column D is index 3
      if (lpRow !== -1) {
        parsedLossPick = this.helpers.getNumericValue(stateSheet, lpRow, 3) * 100;
      }
      if (dccRow !== -1) {
        parsedLaeDcc = this.helpers.getNumericValue(stateSheet, dccRow, 3) * 100;
      }
      if (aoeRow !== -1) {
        parsedLaeAoe = this.helpers.getNumericValue(stateSheet, aoeRow, 3) * 100;
      }
    }

    // Parse Cash Settlement Rates & Ledger
    const csSheet = workbook.Sheets['Cash Settlement'];
    const defaultRates = this.getDefaultRates(program);
    const rates = {
      ...defaultRates,
      ...(dbRates ?? {}),
    };

    // Override with dynamically parsed state rates
    if (parsedLossPick !== undefined && (rates.lossPick === undefined || rates.lossPick === 0)) {
      rates.lossPick = parsedLossPick;
    }
    rates.laeDcc = parsedLaeDcc ?? (program.includes('APD') ? 0.0 : 6.2);
    rates.laeAoe = parsedLaeAoe ?? (program.includes('APD') ? 3.4 : 0.0);

    if (dbRates?.boardsCharge !== undefined) {
      rates.bb = dbRates.boardsCharge;
    }
    if (dbRates?.lossRatioCap !== undefined) {
      rates.lr = dbRates.lossRatioCap;
    }

    let begBal = 0;
    let amtPaid = 0;

    if (csSheet) {
      const getNumCell = (cellRef: string) => {
        const cell = csSheet[cellRef] as XLSX.CellObject | undefined;
        if (cell && typeof cell.v === 'number') return cell.v;
        if (cell?.v !== undefined && cell.v !== null) {
          const val = parseFloat(String(cell.v).replace(/[^0-9.-]/g, ''));
          return isNaN(val) ? 0 : val;
        }
        return 0;
      };

      const valQS = getNumCell('P1');
      if (valQS !== 0) rates.qs = valQS * 100;
      const valCF = getNumCell('P2');
      if (valCF !== 0) rates.cf = valCF * 100;

      const valComm = getNumCell('P3');
      if (valComm !== 0 && dbRates?.comm === undefined) rates.comm = valComm * 100;

      const valBB = getNumCell('P5');
      if (valBB !== 0 && dbRates?.boardsCharge === undefined) rates.bb = valBB * 100;

      const valUlae = getNumCell('P6');
      if (valUlae !== 0 && dbRates?.ulae === undefined) rates.ulae = valUlae * 100;

      const valXol = getNumCell('P7');
      if (valXol !== 0) rates.xol = valXol * 100;

      const valLr = getNumCell('P8');
      if (valLr !== 0 && dbRates?.lossRatioCap === undefined) rates.lr = valLr * 100;

      begBal = getNumCell('L47');
      amtPaid = getNumCell('L49');
    }

    // Determine Month and Year
    const reportDate = this.helpers.getFUTReportDate(workbook);
    if (!reportDate) {
      throw new BadRequestException('Could not detect reporting date in FUT workbook');
    }

    const monthKey = this.helpers.formatMonthKey(reportDate);
    const monthLabel = this.helpers.formatMonthLabel(reportDate);

    let source = 'FUT';
    if (
      monthKey === '2025-12' ||
      fnLower.includes('itd') ||
      fnLower.includes('seeder') ||
      forceOverwrite
    ) {
      source = 'ITD';
    }

    // Validate month key sequence (source-aware: only checks against other FUT workbooks)
    await this.validateSequentialMonth(program, monthKey, source);

    // Check if workbook exists
    let workbookEntity = await this.workbookRepo.findOne({
      where: { program, monthKey, source, isDeleted: false },
    });

    if (workbookEntity) {
      if (!forceOverwrite) {
        throw new ConflictException({
          conflict: true,
          message: `A workbook for program "${program}" and month "${monthLabel}" already exists.`,
        });
      }
      await this.deleteAssociatedBatches(workbookEntity.id);
      workbookEntity.isDeleted = true;
      workbookEntity.deletedAt = new Date();
      await this.workbookRepo.save(workbookEntity);
    }

    workbookEntity = this.workbookRepo.create({
      program,
      monthKey,
      monthLabel,
      source,
      rates,
      ...this.getDefaultMappings(program),
    });

    const savedWorkbook = await this.workbookRepo.save(workbookEntity);

    // Fields exhibit configuration (Rows 14 to 34 - includes reserve fields)
    const FIELDS = STATE_EXHIBIT_FIELDS;

    const stateExhibits: DeepPartial<StateExhibit>[] = [];

    // Parse state exhibit sheets
    for (const sheetName of sheetNames) {
      const cleanSheetName = sheetName.trim();
      const match = cleanSheetName.match(/^MTHLY-([A-Z]{2})$/i);
      if (match && cleanSheetName !== 'MTHLY-TOTAL') {
        const stateCode = match[1].toUpperCase();
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        const dataObj: DeepPartial<StateExhibit> = {
          workbookId: savedWorkbook.id,
          stateCode,
        };

        FIELDS.forEach((fieldId, idx) => {
          const excelRow = 14 + idx; // Rows 14 to 27
          const cols = ['C', 'D', 'E'];
          const cellValues: number[] = [0.0, 0.0, 0.0];

          cols.forEach((colChar, colIdx) => {
            const cellRef = `${colChar}${excelRow}`;
            const cellObj = worksheet[cellRef] as XLSX.CellObject | undefined;
            let cellVal = 0.0;
            if (cellObj) {
              if (typeof cellObj.v === 'number') {
                cellVal = cellObj.v;
              } else if (cellObj.v !== undefined && cellObj.v !== null) {
                const cleanVal = parseFloat(String(cellObj.v).replace(/[^0-9.-]/g, ''));
                cellVal = isNaN(cleanVal) ? 0.0 : cleanVal;
              }
            }
            cellValues[colIdx] = cellVal;
          });

          dataObj[fieldId] = cellValues;
        });

        const ex = this.stateExhibitRepo.create(dataObj);
        stateExhibits.push(ex);
      }
    }

    if (stateExhibits.length === 0) {
      throw new BadRequestException('No state sheets (MTHLY-XX) found in the FUT workbook');
    }

    await this.stateExhibitRepo.save(stateExhibits);

    // Calculate aggregate TOTAL
    await this.recalculateTotalExhibit(savedWorkbook.id);

    // Save Cash Settlement
    const cs = this.cashSettlementRepo.create({
      workbookId: savedWorkbook.id,
      begBal,
      amtPaid,
    });
    await this.cashSettlementRepo.save(cs);

    return {
      message: `Parsed MGA FUT Workbook. Detected ${stateExhibits.length} state sheets.`,
      workbook: savedWorkbook,
    };
  }

  async recalculateTotalExhibit(workbookId: number): Promise<void> {
    const allExhibits = await this.stateExhibitRepo.find({ where: { workbookId } });
    const nonTotalExhibits = allExhibits.filter(e => e.stateCode !== 'TOTAL');
    let totalExhibit = allExhibits.find(e => e.stateCode === 'TOTAL');

    totalExhibit ??= this.stateExhibitRepo.create({
      workbookId,
      stateCode: 'TOTAL',
    });

    const fields = STATE_EXHIBIT_FIELDS;

    fields.forEach(field => {
      const sums = [0, 0, 0];
      nonTotalExhibits.forEach(ex => {
        const arr = ex[field] ?? [];
        for (let i = 0; i < 3; i++) {
          sums[i] += Number(arr[i] ?? 0);
        }
      });
      totalExhibit[field] = sums;
    });

    await this.stateExhibitRepo.save(totalExhibit);
  }

  getDefaultMappings(program: string) {
    let mga = '1201';
    let lob = '000171';
    let lineDescSuffix = 'FUT Starlight T1 Excess';
    let cc = '000';
    const comp = '100';
    const ext = '0000';
    const sub = '';

    if (program === 'Excess SAM') {
      lineDescSuffix = 'FUT Starlight T1 SAM';
    } else if (program === 'Excess HS') {
      lineDescSuffix = 'FUT Starlight T1 HS';
    } else if (program === 'APD Local') {
      mga = '1202';
      lob = '000212';
      lineDescSuffix = 'FUT Starlight T2 APD Local';
    } else if (program === 'MTC Local') {
      mga = '1202';
      lob = '000212';
      lineDescSuffix = 'FUT Starlight T2 MTC Local';
    } else if (program === 'APD Fleet') {
      lob = '000212';
      lineDescSuffix = 'FUT Starlight T1 APD Fleet';
    } else if (program === 'DPR APD') {
      mga = '2002';
      lob = '000212';
      lineDescSuffix = 'FUT Starlight T2 APD DRP';
      cc = '00';
    } else if (program === 'DPR AL') {
      mga = '3002';
      lob = '000171';
      lineDescSuffix = 'FUT Starlight T3 AL DRP';
      cc = '00';
    } else if (program === 'DRP MTC') {
      mga = '3002';
      lob = '000212';
      lineDescSuffix = 'FUT Starlight T3 MTC DRP';
      cc = '00';
    }

    return { mga, lob, lineDescSuffix, cc, comp, ext, sub };
  }

  private getDefaultRates(program: string) {
    const isExcess =
      program.toLowerCase().includes('excess') ||
      program.toLowerCase().includes('nx') ||
      program.toLowerCase().includes('sam') ||
      program.toLowerCase().includes('hs');
    if (isExcess) {
      return {
        qs: 100,
        cf: 5,
        comm: 32.0,
        bb: 0.4,
        ulae: 1.0,
        xol: 2.0,
        lr: 0.0,
        lossPick: 51.8,
        laeDcc: 6.2,
        laeAoe: 0.0,
        boardsCharge: 0.4,
        lossRatioCap: 2.0,
      };
    } else {
      // APD / AL / MTC programs
      return {
        qs: 100,
        cf: 5,
        comm: 29.0,
        bb: 0.4,
        ulae: 7.0,
        xol: 2.0,
        lr: 2.0,
        lossPick: 56.6,
        laeDcc: 0.0,
        laeAoe: 13.4,
        boardsCharge: 0.4,
        lossRatioCap: 2.0,
      };
    }
  }

  private async validateSequentialMonth(
    program: string,
    monthKey: string,
    source: string,
  ): Promise<void> {
    if (monthKey === '2025-12' || source === 'ITD') {
      return;
    }
    const prevMonthKey = this.helpers.getPrevMonthKey(monthKey);
    const prevWb = await this.workbookRepo.findOne({
      where: { program, monthKey: prevMonthKey },
    });

    if (!prevWb) {
      const monthNames = [
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
      const formatLabel = (key: string) => {
        const [y, m] = key.split('-');
        return `${monthNames[parseInt(m) - 1]} ${y}`;
      };
      if (prevMonthKey === '2025-12') {
        throw new BadRequestException(
          `Validation Error: Baseline data for December 2025 is missing. ` +
            `Please generate the ITD file from a Southlake file first and upload it using 'Upload Excel Workbook' to seed the database.`,
        );
      } else {
        throw new BadRequestException(
          `Validation Error: Gaps in reporting month sequence are not allowed. ` +
            `Cannot upload data for ${formatLabel(monthKey)} because the previous month's data (${formatLabel(prevMonthKey)}) has not been uploaded or seeded.`,
        );
      }
    }
  }

  private async deleteAssociatedBatches(workbookId: number): Promise<void> {
    const idStr = String(workbookId);
    await this.workbookRepo.query(
      `DELETE FROM journal_entries WHERE batch_id IN (
        SELECT id FROM journal_entry_batches WHERE batch_number LIKE 'RE-' || $1 || '-%'
      )`,
      [idStr],
    );
    await this.workbookRepo.query(
      `DELETE FROM journal_entry_batches WHERE batch_number LIKE 'RE-' || $1 || '-%'`,
      [idStr],
    );
  }
}
