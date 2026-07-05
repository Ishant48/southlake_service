import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Workbook } from '../entities/workbook.entity';
import { StateExhibit } from '../entities/state-exhibit.entity';
import { CashSettlement } from '../entities/cash-settlement.entity';
import { Treaty } from '../../masters/entities/treaty.entity';
import { ParsingHelpersService } from '../parsing-helpers/parsing-helpers.service';
import type { StarlightParseResult } from '../excel-parser/excel-parser.service';

/** Parses Starlight-format workbooks (summary sheet + per-state tabs) into Workbook/StateExhibit/CashSettlement records, one workbook per reported month column. */
@Injectable()
export class StarlightParserService {
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

  async parseStarlightWorkbook(
    workbook: XLSX.WorkBook,
    filename: string,
    forceOverwrite: boolean = false,
    overrideProgram?: string,
  ): Promise<StarlightParseResult> {
    const sheetNames = workbook.SheetNames;
    const summarySheetName =
      sheetNames.find(name => name === 'Starlight Excess' || name === 'Starlight APD') ??
      sheetNames.find(name => name.toLowerCase().includes('starlight')) ??
      sheetNames[0];

    const sheet = workbook.Sheets[summarySheetName];

    const pwRow = this.helpers.findRowIndexByLabel(sheet, 'Premiums Written');
    const uepRow = this.helpers.findRowIndexByLabel(sheet, 'Unearned Premium Reserve');
    const lossReservesRow = this.helpers.findRowIndexByLabel(sheet, 'Loss Reserves');
    const lossIbnrRow = this.helpers.findRowIndexByLabel(sheet, 'Loss IBNR Reserves');
    const dccReservesRow = this.helpers.findRowIndexByLabel(sheet, 'LAE Reserves - DCC');
    const dccIbnrRow = this.helpers.findRowIndexByLabel(sheet, 'LAE IBNR Reserves - DCC');
    const aoeReservesRow = this.helpers.findRowIndexByLabel(sheet, 'LAE Reserves - AOE');
    const aoeIbnrRow = this.helpers.findRowIndexByLabel(sheet, 'LAE IBNR Reserves - AOE');
    const ulaeIbnrRow = this.helpers.findRowIndexByLabel(sheet, 'ULAE IBNR Reserves');

    const headerInfo = this.helpers.findHeaderRowAndMonths(sheet);

    if (!headerInfo || pwRow === -1) {
      throw new BadRequestException('Invalid Starlight summary sheet layout');
    }

    // Detect Program
    let program = 'Excess NX';
    const b4Cell = sheet['B4'] as XLSX.CellObject | undefined;
    const b4Val = b4Cell ? String(b4Cell.v).toLowerCase() : '';
    const fnLower = filename ? filename.toLowerCase() : '';

    if (b4Val.includes('sam') || fnLower.includes('sam')) {
      program = 'Excess SAM';
    } else if (b4Val.includes('hs') || fnLower.includes('hs')) {
      program = 'Excess HS';
    } else if (b4Val.includes('local') || fnLower.includes('local')) {
      if (b4Val.includes('mtc') || fnLower.includes('mtc')) {
        program = 'MTC Local';
      } else {
        program = 'APD Local';
      }
    } else if (b4Val.includes('fleet') || fnLower.includes('fleet')) {
      program = 'APD Fleet';
    } else if (
      (b4Val.includes('al') || fnLower.includes('al')) &&
      (b4Val.includes('drp') ||
        b4Val.includes('dpr') ||
        fnLower.includes('drp') ||
        fnLower.includes('dpr'))
    ) {
      program = 'DPR AL';
    } else if (
      (b4Val.includes('mtc') || fnLower.includes('mtc')) &&
      (b4Val.includes('drp') ||
        b4Val.includes('dpr') ||
        fnLower.includes('drp') ||
        fnLower.includes('dpr'))
    ) {
      program = 'DRP MTC';
    } else if (
      b4Val.includes('drp') ||
      b4Val.includes('dpr') ||
      fnLower.includes('drp') ||
      fnLower.includes('dpr')
    ) {
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
          laeDcc: dbProgram.ulaePct !== null ? Number(dbProgram.ulaePct) : undefined,
          laeAoe: dbProgram.ulaePct !== null ? Number(dbProgram.ulaePct) : undefined,
          boardsCharge: dbProgram.bbPct !== null ? Number(dbProgram.bbPct) : undefined,
          lossRatioCap: dbProgram.lrCapPct !== null ? Number(dbProgram.lrCapPct) : undefined,
          qs: dbProgram.qsPct !== null ? Number(dbProgram.qsPct) : undefined,
          cf: dbProgram.cfPct !== null ? Number(dbProgram.cfPct) : undefined,
          xol: dbProgram.xolPct !== null ? Number(dbProgram.xolPct) : undefined,
          lr: dbProgram.lrCapPct !== null ? Number(dbProgram.lrCapPct) : undefined,
        }
      : null;

    // Parse Rates
    const commRowIdx = this.helpers.findRowIndexByLabel(sheet, 'Ceding Commissions');
    let parsedComm = 32.0;
    if (commRowIdx !== -1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: commRowIdx, c: 1 })] as
        | XLSX.CellObject
        | undefined;
      const label = cell?.v ?? '';
      const m = String(label).match(/Ceding Commissions at (\d+(?:\.\d+)?)%/i);
      if (m) parsedComm = parseFloat(m[1]);
    }

    const ulaeRowIdx = this.helpers.findRowIndexByLabel(
      sheet,
      'Unallocated Loss Adjustment Expense',
    );
    let parsedUlae = 1.0;
    if (ulaeRowIdx !== -1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: ulaeRowIdx, c: 1 })] as
        | XLSX.CellObject
        | undefined;
      const label = cell?.v ?? '';
      const m = String(label).match(/Unallocated Loss Adjustment Expense at (\d+(?:\.\d+)?)%/i);
      if (m) parsedUlae = parseFloat(m[1]);
    }

    const lossPickRowIdx = this.helpers.findRowIndexByExactLabel(sheet, 'Loss Pick');
    const laeDccRowIdx = this.helpers.findRowIndexByExactLabel(sheet, 'LAE - DCC');
    const laeAoeRowIdx = this.helpers.findRowIndexByExactLabel(sheet, 'LAE - AOE');

    const createdWorkbooks: Workbook[] = [];

    // Parse data for each month column
    for (let idx = 0; idx < headerInfo.months.length; idx++) {
      const m = headerInfo.months[idx];
      const curC = m.colIdx;
      const prevC = idx > 0 ? headerInfo.months[idx - 1].colIdx : null;

      const monthKey = this.helpers.parseDateToMonthKey(m.monthName);
      if (!monthKey) continue;

      const valPW = this.helpers.getNumericValue(sheet, pwRow, curC);
      const valCurrUEP = this.helpers.getNumericValue(sheet, uepRow, curC);
      const valPrevLossReserves =
        prevC !== null ? this.helpers.getNumericValue(sheet, lossReservesRow, prevC) : 0.0;
      const valPrevLossIBNR =
        prevC !== null ? this.helpers.getNumericValue(sheet, lossIbnrRow, prevC) : 0.0;
      const valPrevDCCReserves =
        prevC !== null ? this.helpers.getNumericValue(sheet, dccReservesRow, prevC) : 0.0;
      const valPrevDCCIBNR =
        prevC !== null ? this.helpers.getNumericValue(sheet, dccIbnrRow, prevC) : 0.0;
      const valPrevAOEReserves =
        prevC !== null ? this.helpers.getNumericValue(sheet, aoeReservesRow, prevC) : 0.0;
      const valPrevAOEIBNR =
        prevC !== null ? this.helpers.getNumericValue(sheet, aoeIbnrRow, prevC) : 0.0;
      const valPrevULAEIBNR =
        prevC !== null ? this.helpers.getNumericValue(sheet, ulaeIbnrRow, prevC) : 0.0;

      const pLossPick =
        lossPickRowIdx !== -1
          ? this.helpers.getNumericValue(sheet, lossPickRowIdx, curC) * 100
          : 51.8;
      const pLaeDcc =
        laeDccRowIdx !== -1
          ? this.helpers.getNumericValue(sheet, laeDccRowIdx, curC) * 100
          : program.includes('APD')
            ? 0.0
            : 6.2;
      const pLaeAoe =
        laeAoeRowIdx !== -1
          ? this.helpers.getNumericValue(sheet, laeAoeRowIdx, curC) * 100
          : program.includes('APD')
            ? 13.4
            : 0.0;

      const rates = {
        qs: 100,
        cf: 5,
        comm: dbRates?.comm ?? parsedComm,
        bb: dbRates?.boardsCharge ?? 0.4,
        ulae: dbRates?.ulae ?? parsedUlae,
        xol: 2.0,
        lr: 0.0,
        lossPick: dbRates?.lossPick ?? (pLossPick || 51.8),
        laeDcc: dbRates?.laeDcc ?? pLaeDcc,
        laeAoe: dbRates?.laeAoe ?? pLaeAoe,
        boardsCharge: dbRates?.boardsCharge ?? 0.4,
        lossRatioCap: dbRates?.lossRatioCap ?? 2.0,
      };

      // Validate month key sequence (source-aware: only checks against other Starlight workbooks)
      await this.validateSequentialMonth(program, monthKey, 'Starlight');

      // Check if workbook already exists
      let workbookEntity = await this.workbookRepo.findOne({
        where: { program, monthKey, source: 'Starlight', isDeleted: false },
      });

      if (workbookEntity) {
        if (!forceOverwrite) {
          throw new ConflictException({
            conflict: true,
            message: `A workbook for program "${program}" and month "${m.monthName}" already exists.`,
          });
        }
        // Soft-delete old one and cascade details
        await this.deleteAssociatedBatches(workbookEntity.id);
        workbookEntity.isDeleted = true;
        workbookEntity.deletedAt = new Date();
        await this.workbookRepo.save(workbookEntity);
      }

      workbookEntity = this.workbookRepo.create({
        program,
        monthKey,
        monthLabel: m.monthName,
        source: 'Starlight',
        rates,
        ...this.getDefaultMappings(program),
      });

      const savedWorkbook = await this.workbookRepo.save(workbookEntity);

      // Create state exhibits
      const stateExhibits: StateExhibit[] = [];

      // Parse each state tab (sheets with name of length 2)
      for (const sheetName of sheetNames) {
        const cleanName = sheetName.trim();
        if (cleanName.length === 2) {
          const stateCode = cleanName.toUpperCase();
          const stateSheet = workbook.Sheets[sheetName];
          if (!stateSheet) continue;

          // Find column matching monthName in this state sheet
          const stateHeader = this.helpers.findHeaderRowAndMonths(stateSheet);
          let curStateC: number | null = null;
          let prevStateC: number | null = null;

          if (stateHeader) {
            const curMonthHeader = stateHeader.months.find(mh => mh.monthName === m.monthName);
            if (curMonthHeader) curStateC = curMonthHeader.colIdx;

            if (idx > 0) {
              const prevMonthHeader = stateHeader.months.find(
                mh => mh.monthName === headerInfo.months[idx - 1].monthName,
              );
              if (prevMonthHeader) prevStateC = prevMonthHeader.colIdx;
            }
          }

          if (curStateC !== null) {
            const sPW = this.helpers.getNumericValue(stateSheet, pwRow, curStateC);
            const sCurrUEP = this.helpers.getNumericValue(stateSheet, uepRow, curStateC);
            const sPrevLossReserves =
              prevStateC !== null
                ? this.helpers.getNumericValue(stateSheet, lossReservesRow, prevStateC)
                : 0.0;
            const sPrevLossIBNR =
              prevStateC !== null
                ? this.helpers.getNumericValue(stateSheet, lossIbnrRow, prevStateC)
                : 0.0;
            const sPrevDCCReserves =
              prevStateC !== null
                ? this.helpers.getNumericValue(stateSheet, dccReservesRow, prevStateC)
                : 0.0;
            const sPrevDCCIBNR =
              prevStateC !== null
                ? this.helpers.getNumericValue(stateSheet, dccIbnrRow, prevStateC)
                : 0.0;
            const sPrevAOEReserves =
              prevStateC !== null
                ? this.helpers.getNumericValue(stateSheet, aoeReservesRow, prevStateC)
                : 0.0;
            const sPrevAOEIBNR =
              prevStateC !== null
                ? this.helpers.getNumericValue(stateSheet, aoeIbnrRow, prevStateC)
                : 0.0;
            const sPrevULAEIBNR =
              prevStateC !== null
                ? this.helpers.getNumericValue(stateSheet, ulaeIbnrRow, prevStateC)
                : 0.0;

            const ex = this.stateExhibitRepo.create({
              workbookId: savedWorkbook.id,
              stateCode,
              pw: [0, sPW, 0],
              pfw: [0, 0, 0],
              pc: [0, sPW, 0],
              pfc: [0, 0, 0],
              tax: [0, 0, 0],
              lp: [0, 0, 0],
              laep: [0, 0, 0],
              ae_paid: [0, sPrevULAEIBNR, 0],
              pe: [0, 0, 0],
              pfe: [0, 0, 0],
              uep: [0, sCurrUEP, 0],
              lu: [0, sPrevLossIBNR, 0],
              laeu: [0, sPrevDCCIBNR, 0],
              aeu: [0, sPrevULAEIBNR, 0],
              loss_reserves: [0, sPrevLossReserves, 0],
              loss_ibnr: [0, sPrevLossIBNR, 0],
              lae_reserves_dcc: [0, sPrevDCCReserves, 0],
              lae_ibnr_dcc: [0, sPrevDCCIBNR, 0],
              lae_reserves_aoe: [0, sPrevAOEReserves, 0],
              lae_ibnr_aoe: [0, sPrevAOEIBNR, 0],
              ulae_ibnr: [0, sPrevULAEIBNR, 0],
            });
            stateExhibits.push(ex);
          }
        }
      }

      // Add TOTAL exhibit
      const totalEx = this.stateExhibitRepo.create({
        workbookId: savedWorkbook.id,
        stateCode: 'TOTAL',
        pw: [0, valPW, 0],
        pfw: [0, 0, 0],
        pc: [0, valPW, 0],
        pfc: [0, 0, 0],
        tax: [0, 0, 0],
        lp: [0, 0, 0],
        laep: [0, 0, 0],
        ae_paid: [0, valPrevULAEIBNR, 0],
        pe: [0, 0, 0],
        pfe: [0, 0, 0],
        uep: [0, valCurrUEP, 0],
        lu: [0, valPrevLossIBNR, 0],
        laeu: [0, valPrevDCCIBNR, 0],
        aeu: [0, valPrevULAEIBNR, 0],
        loss_reserves: [0, valPrevLossReserves, 0],
        loss_ibnr: [0, valPrevLossIBNR, 0],
        lae_reserves_dcc: [0, valPrevDCCReserves, 0],
        lae_ibnr_dcc: [0, valPrevDCCIBNR, 0],
        lae_reserves_aoe: [0, valPrevAOEReserves, 0],
        lae_ibnr_aoe: [0, valPrevAOEIBNR, 0],
        ulae_ibnr: [0, valPrevULAEIBNR, 0],
      });
      stateExhibits.push(totalEx);

      await this.stateExhibitRepo.save(stateExhibits);

      // Create Cash Settlement
      const cs = this.cashSettlementRepo.create({
        workbookId: savedWorkbook.id,
        begBal: 0,
        amtPaid: 0,
      });
      await this.cashSettlementRepo.save(cs);

      createdWorkbooks.push(savedWorkbook);
    }

    return {
      message: `Parsed Starlight Summary. Created ${createdWorkbooks.length} monthly workbooks.`,
      workbooks: createdWorkbooks,
    };
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
