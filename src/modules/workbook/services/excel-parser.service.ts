import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../../entities/workbook.entity';
import { StateExhibit } from '../../../entities/state-exhibit.entity';
import { CashSettlement } from '../../../entities/cash-settlement.entity';
import { Treaty } from '../../../entities/treaty.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelParserService {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
    @InjectRepository(StateExhibit)
    private readonly stateExhibitRepo: Repository<StateExhibit>,
    @InjectRepository(CashSettlement)
    private readonly cashSettlementRepo: Repository<CashSettlement>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  async parseWorkbook(fileBuffer: Buffer, filename: string, forceOverwrite: boolean = false, overrideProgram?: string): Promise<any> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const isStarlight = sheetNames.some(
      (name) => name.toLowerCase().includes('starlight'),
    );

    if (isStarlight) {
      return this.parseStarlightWorkbook(workbook, filename, forceOverwrite, overrideProgram);
    } else {
      return this.parseFUTWorkbook(workbook, filename, forceOverwrite, overrideProgram);
    }
  }

  private async parseStarlightWorkbook(workbook: XLSX.WorkBook, filename: string, forceOverwrite: boolean = false, overrideProgram?: string) {
    const sheetNames = workbook.SheetNames;
    const summarySheetName =
      sheetNames.find((name) => name === 'Starlight Excess' || name === 'Starlight APD') ||
      sheetNames.find((name) => name.toLowerCase().includes('starlight')) ||
      sheetNames[0];

    const sheet = workbook.Sheets[summarySheetName];

    const pwRow = this.findRowIndexByLabel(sheet, 'Premiums Written');
    const uepRow = this.findRowIndexByLabel(sheet, 'Unearned Premium Reserve');
    const lossReservesRow = this.findRowIndexByLabel(sheet, 'Loss Reserves');
    const lossIbnrRow = this.findRowIndexByLabel(sheet, 'Loss IBNR Reserves');
    const dccReservesRow = this.findRowIndexByLabel(sheet, 'LAE Reserves - DCC');
    const dccIbnrRow = this.findRowIndexByLabel(sheet, 'LAE IBNR Reserves - DCC');
    const aoeReservesRow = this.findRowIndexByLabel(sheet, 'LAE Reserves - AOE');
    const aoeIbnrRow = this.findRowIndexByLabel(sheet, 'LAE IBNR Reserves - AOE');
    const ulaeIbnrRow = this.findRowIndexByLabel(sheet, 'ULAE IBNR Reserves');

    const headerInfo = this.findHeaderRowAndMonths(sheet);

    if (!headerInfo || pwRow === -1) {
      throw new BadRequestException('Invalid Starlight summary sheet layout');
    }

    // Detect Program
    let program = 'Excess NX';
    const b4Cell = sheet['B4'];
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
      (b4Val.includes('drp') || b4Val.includes('dpr') || fnLower.includes('drp') || fnLower.includes('dpr'))
    ) {
      program = 'DPR AL';
    } else if (
      (b4Val.includes('mtc') || fnLower.includes('mtc')) &&
      (b4Val.includes('drp') || b4Val.includes('dpr') || fnLower.includes('drp') || fnLower.includes('dpr'))
    ) {
      program = 'DRP MTC';
    } else if (
      b4Val.includes('drp') || b4Val.includes('dpr') || fnLower.includes('drp') || fnLower.includes('dpr')
    ) {
      program = 'DPR APD';
    }

    if (overrideProgram) {
      program = overrideProgram;
    }

    const dbProgram = await this.treatyRepo.findOne({ where: { name: program } });
    const dbRates = dbProgram ? {
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
    } : null;

    // Parse Rates
    const commRowIdx = this.findRowIndexByLabel(sheet, 'Ceding Commissions');
    let parsedComm = 32.0;
    if (commRowIdx !== -1) {
      const label = sheet[XLSX.utils.encode_cell({ r: commRowIdx, c: 1 })]?.v || '';
      const m = String(label).match(/Ceding Commissions at (\d+(?:\.\d+)?)%/i);
      if (m) parsedComm = parseFloat(m[1]);
    }

    const ulaeRowIdx = this.findRowIndexByLabel(sheet, 'Unallocated Loss Adjustment Expense');
    let parsedUlae = 1.0;
    if (ulaeRowIdx !== -1) {
      const label = sheet[XLSX.utils.encode_cell({ r: ulaeRowIdx, c: 1 })]?.v || '';
      const m = String(label).match(/Unallocated Loss Adjustment Expense at (\d+(?:\.\d+)?)%/i);
      if (m) parsedUlae = parseFloat(m[1]);
    }

    const lossPickRowIdx = this.findRowIndexByExactLabel(sheet, 'Loss Pick');
    const laeDccRowIdx = this.findRowIndexByExactLabel(sheet, 'LAE - DCC');
    const laeAoeRowIdx = this.findRowIndexByExactLabel(sheet, 'LAE - AOE');

    const createdWorkbooks = [];

    // Parse data for each month column
    for (let idx = 0; idx < headerInfo.months.length; idx++) {
      const m = headerInfo.months[idx];
      const curC = m.colIdx;
      const prevC = idx > 0 ? headerInfo.months[idx - 1].colIdx : null;

      const monthKey = this.parseDateToMonthKey(m.monthName);
      if (!monthKey) continue;

      const valPW = this.getNumericValue(sheet, pwRow, curC);
      const valCurrUEP = this.getNumericValue(sheet, uepRow, curC);
      const valPrevUEP = prevC !== null ? this.getNumericValue(sheet, uepRow, prevC) : 0.00;
      const valPrevLossReserves = prevC !== null ? this.getNumericValue(sheet, lossReservesRow, prevC) : 0.00;
      const valPrevLossIBNR = prevC !== null ? this.getNumericValue(sheet, lossIbnrRow, prevC) : 0.00;
      const valPrevDCCReserves = prevC !== null ? this.getNumericValue(sheet, dccReservesRow, prevC) : 0.00;
      const valPrevDCCIBNR = prevC !== null ? this.getNumericValue(sheet, dccIbnrRow, prevC) : 0.00;
      const valPrevAOEReserves = prevC !== null ? this.getNumericValue(sheet, aoeReservesRow, prevC) : 0.00;
      const valPrevAOEIBNR = prevC !== null ? this.getNumericValue(sheet, aoeIbnrRow, prevC) : 0.00;
      const valPrevULAEIBNR = prevC !== null ? this.getNumericValue(sheet, ulaeIbnrRow, prevC) : 0.00;

      const pLossPick = lossPickRowIdx !== -1 ? this.getNumericValue(sheet, lossPickRowIdx, curC) * 100 : 51.8;
      const pLaeDcc = laeDccRowIdx !== -1 ? this.getNumericValue(sheet, laeDccRowIdx, curC) * 100 : (program.includes('APD') ? 0.0 : 6.2);
      const pLaeAoe = laeAoeRowIdx !== -1 ? this.getNumericValue(sheet, laeAoeRowIdx, curC) * 100 : (program.includes('APD') ? 13.4 : 0.0);

      const rates = {
        qs: 100,
        cf: 5,
        comm: dbRates?.comm !== undefined ? dbRates.comm : parsedComm,
        bb: dbRates?.boardsCharge !== undefined ? dbRates.boardsCharge : 0.40,
        ulae: dbRates?.ulae !== undefined ? dbRates.ulae : parsedUlae,
        xol: 2.0,
        lr: 0.0,
        lossPick: dbRates?.lossPick !== undefined ? dbRates.lossPick : (pLossPick || 51.8),
        laeDcc: dbRates?.laeDcc !== undefined ? dbRates.laeDcc : pLaeDcc,
        laeAoe: dbRates?.laeAoe !== undefined ? dbRates.laeAoe : pLaeAoe,
        boardsCharge: dbRates?.boardsCharge !== undefined ? dbRates.boardsCharge : 0.40,
        lossRatioCap: dbRates?.lossRatioCap !== undefined ? dbRates.lossRatioCap : 2.0,
      };

      // Validate month key sequence (source-aware: only checks against other Starlight workbooks)
      await this.validateSequentialMonth(program, monthKey, 'Starlight');

      // Check if workbook already exists
      let workbookEntity = await this.workbookRepo.findOne({
        where: { program, monthKey, source: 'Starlight' },
      });

      if (workbookEntity) {
        if (!forceOverwrite) {
          throw new ConflictException({
            conflict: true,
            message: `A workbook for program "${program}" and month "${m.monthName}" already exists.`
          });
        }
        // Delete old one and cascade details
        await this.deleteAssociatedBatches(workbookEntity.id);
        await this.workbookRepo.remove(workbookEntity);
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
          const stateHeader = this.findHeaderRowAndMonths(stateSheet);
          let curStateC = null;
          let prevStateC = null;

          if (stateHeader) {
            const curMonthHeader = stateHeader.months.find((mh) => mh.monthName === m.monthName);
            if (curMonthHeader) curStateC = curMonthHeader.colIdx;

            if (idx > 0) {
              const prevMonthHeader = stateHeader.months.find((mh) => mh.monthName === headerInfo.months[idx - 1].monthName);
              if (prevMonthHeader) prevStateC = prevMonthHeader.colIdx;
            }
          }

          if (curStateC !== null) {
            const sPW = this.getNumericValue(stateSheet, pwRow, curStateC);
            const sCurrUEP = this.getNumericValue(stateSheet, uepRow, curStateC);
            const sPrevUEP = prevStateC !== null ? this.getNumericValue(stateSheet, uepRow, prevStateC) : 0.00;
            const sPrevLossReserves = prevStateC !== null ? this.getNumericValue(stateSheet, lossReservesRow, prevStateC) : 0.00;
            const sPrevLossIBNR = prevStateC !== null ? this.getNumericValue(stateSheet, lossIbnrRow, prevStateC) : 0.00;
            const sPrevDCCReserves = prevStateC !== null ? this.getNumericValue(stateSheet, dccReservesRow, prevStateC) : 0.00;
            const sPrevDCCIBNR = prevStateC !== null ? this.getNumericValue(stateSheet, dccIbnrRow, prevStateC) : 0.00;
            const sPrevAOEReserves = prevStateC !== null ? this.getNumericValue(stateSheet, aoeReservesRow, prevStateC) : 0.00;
            const sPrevAOEIBNR = prevStateC !== null ? this.getNumericValue(stateSheet, aoeIbnrRow, prevStateC) : 0.00;
            const sPrevULAEIBNR = prevStateC !== null ? this.getNumericValue(stateSheet, ulaeIbnrRow, prevStateC) : 0.00;

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
            }) as StateExhibit;
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

  private async parseFUTWorkbook(workbook: XLSX.WorkBook, filename: string, forceOverwrite: boolean = false, overrideProgram?: string) {
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
    const dbRates = dbProgram ? {
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
    } : null;

    // Try to parse actuarial rates dynamically from first state sheet (if exists)
    let parsedLossPick: number | undefined;
    let parsedLaeDcc: number | undefined;
    let parsedLaeAoe: number | undefined;

    const stateSheetName = sheetNames.find(name => name.trim().length === 2 || name.trim().startsWith('MTHLY-'));
    if (stateSheetName) {
      const stateSheet = workbook.Sheets[stateSheetName];
      const lpRow = this.findRowIndexByExactLabel(stateSheet, 'Loss Pick');
      const dccRow = this.findRowIndexByExactLabel(stateSheet, 'LAE - DCC');
      const aoeRow = this.findRowIndexByExactLabel(stateSheet, 'LAE - AOE');

      // Column D is index 3
      if (lpRow !== -1) {
        parsedLossPick = this.getNumericValue(stateSheet, lpRow, 3) * 100;
      }
      if (dccRow !== -1) {
        parsedLaeDcc = this.getNumericValue(stateSheet, dccRow, 3) * 100;
      }
      if (aoeRow !== -1) {
        parsedLaeAoe = this.getNumericValue(stateSheet, aoeRow, 3) * 100;
      }
    }

    // Parse Cash Settlement Rates & Ledger
    const csSheet = workbook.Sheets['Cash Settlement'];
    const defaultRates = this.getDefaultRates(program);
    let rates = {
      ...defaultRates,
      ...(dbRates || {}),
    };

    // Override with dynamically parsed state rates
    if (parsedLossPick !== undefined && (rates.lossPick === undefined || rates.lossPick === 0)) {
      rates.lossPick = parsedLossPick;
    }
    rates.laeDcc = parsedLaeDcc !== undefined ? parsedLaeDcc : (program.includes('APD') ? 0.0 : 6.2);
    rates.laeAoe = parsedLaeAoe !== undefined ? parsedLaeAoe : (program.includes('APD') ? 3.4 : 0.0);

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
        const cell = csSheet[cellRef];
        if (cell && typeof cell.v === 'number') return cell.v;
        if (cell && cell.v !== undefined && cell.v !== null) {
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
    const reportDate = this.getFUTReportDate(workbook);
    if (!reportDate) {
      throw new BadRequestException('Could not detect reporting date in FUT workbook');
    }

    const monthKey = this.formatMonthKey(reportDate);
    const monthLabel = this.formatMonthLabel(reportDate);

    let source = 'FUT';
    if (monthKey === '2025-12' || fnLower.includes('itd') || fnLower.includes('seeder') || forceOverwrite) {
      source = 'ITD';
    }

    // Validate month key sequence (source-aware: only checks against other FUT workbooks)
    await this.validateSequentialMonth(program, monthKey, source);

    // Check if workbook exists
    let workbookEntity = await this.workbookRepo.findOne({
      where: { program, monthKey, source },
    });

    if (workbookEntity) {
      if (!forceOverwrite) {
        throw new ConflictException({
          conflict: true,
          message: `A workbook for program "${program}" and month "${monthLabel}" already exists.`
        });
      }
      await this.deleteAssociatedBatches(workbookEntity.id);
      await this.workbookRepo.remove(workbookEntity);
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
    const FIELDS = [
      'pw', 'pfw', 'pc', 'pfc', 'tax', 'lp', 'laep', 'ae_paid',
      'pe', 'pfe', 'uep', 'lu', 'laeu', 'aeu',
      'loss_reserves', 'loss_ibnr', 'lae_reserves_dcc', 'lae_ibnr_dcc',
      'lae_reserves_aoe', 'lae_ibnr_aoe', 'ulae_ibnr'
    ];

    const stateExhibits: StateExhibit[] = [];

    // Parse state exhibit sheets
    for (const sheetName of sheetNames) {
      const cleanSheetName = sheetName.trim();
      const match = cleanSheetName.match(/^MTHLY-([A-Z]{2})$/i);
      if (match && cleanSheetName !== 'MTHLY-TOTAL') {
        const stateCode = match[1].toUpperCase();
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        const dataObj: any = {
          workbookId: savedWorkbook.id,
          stateCode,
        };

        FIELDS.forEach((fieldId, idx) => {
          const excelRow = 14 + idx; // Rows 14 to 27
          const cols = ['C', 'D', 'E'];
          const cellValues = [0.00, 0.00, 0.00];

          cols.forEach((colChar, colIdx) => {
            const cellRef = `${colChar}${excelRow}`;
            const cellObj = worksheet[cellRef];
            let cellVal = 0.00;
            if (cellObj) {
              if (typeof cellObj.v === 'number') {
                cellVal = cellObj.v;
              } else if (cellObj.v !== undefined && cellObj.v !== null) {
                const cleanVal = parseFloat(String(cellObj.v).replace(/[^0-9.-]/g, ''));
                cellVal = isNaN(cleanVal) ? 0.00 : cleanVal;
              }
            }
            cellValues[colIdx] = cellVal;
          });

          dataObj[fieldId] = cellValues;
        });

        const ex = this.stateExhibitRepo.create(dataObj) as unknown as StateExhibit;
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
    const nonTotalExhibits = allExhibits.filter((e) => e.stateCode !== 'TOTAL');
    let totalExhibit = allExhibits.find((e) => e.stateCode === 'TOTAL');

    if (!totalExhibit) {
      totalExhibit = this.stateExhibitRepo.create({
        workbookId,
        stateCode: 'TOTAL',
      });
    }

    const fields = [
      'pw', 'pfw', 'pc', 'pfc', 'tax', 'lp', 'laep', 'ae_paid',
      'pe', 'pfe', 'uep', 'lu', 'laeu', 'aeu',
      'loss_reserves', 'loss_ibnr', 'lae_reserves_dcc', 'lae_ibnr_dcc',
      'lae_reserves_aoe', 'lae_ibnr_aoe', 'ulae_ibnr'
    ];

    fields.forEach((field) => {
      const sums = [0, 0, 0];
      nonTotalExhibits.forEach((ex) => {
        const arr = (ex as any)[field] || [];
        for (let i = 0; i < 3; i++) {
          sums[i] += Number(arr[i] || 0);
        }
      });
      (totalExhibit as any)[field] = sums;
    });

    await this.stateExhibitRepo.save(totalExhibit);
  }

  private findRowIndexByLabel(sheet: XLSX.WorkSheet, labelSubstr: string): number {
    const ref = sheet['!ref'];
    if (!ref) return -1;
    const range = XLSX.utils.decode_range(ref);
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c: 1 })]; // Column B
      if (cell && cell.v && String(cell.v).toLowerCase().includes(labelSubstr.toLowerCase())) {
        return r;
      }
    }
    return -1;
  }

  private findRowIndexByExactLabel(sheet: XLSX.WorkSheet, labelStr: string): number {
    const ref = sheet['!ref'];
    if (!ref) return -1;
    const range = XLSX.utils.decode_range(ref);
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c: 1 })]; // Column B
      if (cell && cell.v && String(cell.v).trim().toLowerCase() === labelStr.toLowerCase()) {
        return r;
      }
    }
    return -1;
  }

  private findHeaderRowAndMonths(sheet: XLSX.WorkSheet) {
    const ref = sheet['!ref'];
    if (!ref) return null;
    const range = XLSX.utils.decode_range(ref);
    for (let r = range.s.r; r <= Math.min(10, range.e.r); r++) {
      const cols = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (cell && cell.v && String(cell.v).match(/^[A-Za-z]{3}-\d{2}$/)) {
          cols.push({ colIdx: c, monthName: String(cell.v) });
        }
      }
      if (cols.length > 0) {
        return { headerRowIdx: r, months: cols };
      }
    }
    return null;
  }

  private getNumericValue(sheet: XLSX.WorkSheet, r: number, c: number): number {
    if (r < 0 || c === null || c === undefined) return 0.00;
    const cell = sheet[XLSX.utils.encode_cell({ r, c })];
    if (!cell) return 0.00;
    if (typeof cell.v === 'number') return cell.v;
    if (cell.v !== undefined && cell.v !== null) {
      const clean = parseFloat(String(cell.v).replace(/[^0-9.-]/g, ''));
      return isNaN(clean) ? 0.00 : clean;
    }
    return 0.00;
  }

  private getFUTReportDate(workbook: XLSX.WorkBook): Date | null {
    const stateSheetName = workbook.SheetNames.find(
      (name) => name.trim().match(/^MTHLY-([A-Z]{2})$/i) && name.trim() !== 'MTHLY-TOTAL',
    );
    if (stateSheetName) {
      const sheet = workbook.Sheets[stateSheetName];
      const cell = sheet['C4'];
      if (cell && cell.v) {
        const parsed = this.parseDateValue(cell.v);
        if (parsed) return parsed;
      }
    }
    const csSheet = workbook.Sheets['Cash Settlement'];
    if (csSheet) {
      const cell = csSheet['C9'];
      if (cell && cell.v) {
        const parsed = this.parseDateValue(cell.v);
        if (parsed) return parsed;
      }
    }
    return null;
  }

  private parseDateValue(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') {
      return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    const str = String(val).trim();
    const matchMonthYearStr = str.match(/^([A-Za-z]+)-(\d{2})$/);
    if (matchMonthYearStr) {
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
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

  private formatMonthKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private formatMonthLabel(date: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  private parseDateToMonthKey(str: string): string {
    if (!str) return '';
    const cleanStr = String(str).trim();
    const match = cleanStr.match(/^([A-Za-z]{3})-(\d{2})$/);
    if (match) {
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      const m = months[match[1].toLowerCase()];
      if (m) {
        const year = '20' + match[2];
        return `${year}-${m}`;
      }
    }
    return '';
  }

  private async validateSequentialMonth(program: string, monthKey: string, source: string): Promise<void> {
    if (monthKey === '2025-12' || source === 'ITD') {
      return;
    }
    const prevMonthKey = this.getPrevMonthKey(monthKey);
    const prevWb = await this.workbookRepo.findOne({
      where: { program, monthKey: prevMonthKey }
    });

    if (!prevWb) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const formatLabel = (key: string) => {
        const [y, m] = key.split('-');
        return `${monthNames[parseInt(m) - 1]} ${y}`;
      };
      if (prevMonthKey === '2025-12') {
        throw new BadRequestException(
          `Validation Error: Baseline data for December 2025 is missing. ` +
          `Please generate the ITD file from a Southlake file first and upload it using 'Upload Excel Workbook' to seed the database.`
        );
      } else {
        throw new BadRequestException(
          `Validation Error: Gaps in reporting month sequence are not allowed. ` +
          `Cannot upload data for ${formatLabel(monthKey)} because the previous month's data (${formatLabel(prevMonthKey)}) has not been uploaded or seeded.`
        );
      }
    }
  }

  private getNextMonthKey(monthKey: string): string {
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

  private getPrevMonthKey(monthKey: string): string {
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

  async generateITDWorkbookFromStarlight(fileBuffer: Buffer): Promise<Buffer> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    const summarySheetName =
      sheetNames.find((name) => name === 'Starlight Excess' || name === 'Starlight APD') ||
      sheetNames.find((name) => name.toLowerCase().includes('starlight')) ||
      sheetNames[0];

    const summarySheet = workbook.Sheets[summarySheetName];
    if (!summarySheet) {
      throw new BadRequestException('Invalid Starlight summary sheet');
    }

    const pwRow = this.findRowIndexByLabel(summarySheet, 'Premiums Written');
    const uepRow = this.findRowIndexByLabel(summarySheet, 'Unearned Premium Reserve');
    const lossReservesRow = this.findRowIndexByLabel(summarySheet, 'Loss Reserves');
    const lossIbnrRow = this.findRowIndexByLabel(summarySheet, 'Loss IBNR Reserves');
    const dccReservesRow = this.findRowIndexByLabel(summarySheet, 'LAE Reserves - DCC');
    const dccIbnrRow = this.findRowIndexByLabel(summarySheet, 'LAE IBNR Reserves - DCC');
    const aoeReservesRow = this.findRowIndexByLabel(summarySheet, 'LAE Reserves - AOE');
    const aoeIbnrRow = this.findRowIndexByLabel(summarySheet, 'LAE IBNR Reserves - AOE');
    const ulaeIbnrRow = this.findRowIndexByLabel(summarySheet, 'ULAE IBNR Reserves');
    
    const lpRow = this.findRowIndexByLabel(summarySheet, 'Losses Paid');
    const dccPaidRow = this.findRowIndexByLabel(summarySheet, 'Defense and Cost Containment Expense Paid');
    const aoePaidRow = this.findRowIndexByLabel(summarySheet, 'Adjusting & Other Expense Paid');

    const itdColIdx = 2; // Column C

    const outWb = XLSX.utils.book_new();

    // 1. Process and append MTHLY-TOTAL first using the summary sheet
    const total_pw = this.getNumericValue(summarySheet, pwRow, itdColIdx);
    const total_uep = this.getNumericValue(summarySheet, uepRow, itdColIdx);
    const total_loss_reserves = this.getNumericValue(summarySheet, lossReservesRow, itdColIdx);
    const total_loss_ibnr = this.getNumericValue(summarySheet, lossIbnrRow, itdColIdx);
    const total_lae_reserves_dcc = this.getNumericValue(summarySheet, dccReservesRow, itdColIdx);
    const total_lae_ibnr_dcc = this.getNumericValue(summarySheet, dccIbnrRow, itdColIdx);
    const total_lae_reserves_aoe = this.getNumericValue(summarySheet, aoeReservesRow, itdColIdx);
    const total_lae_ibnr_aoe = this.getNumericValue(summarySheet, aoeIbnrRow, itdColIdx);
    const total_ulae_ibnr = this.getNumericValue(summarySheet, ulaeIbnrRow, itdColIdx);

    const total_lp = this.getNumericValue(summarySheet, lpRow, itdColIdx);
    const total_laep = this.getNumericValue(summarySheet, dccPaidRow, itdColIdx);
    const total_ae_paid = this.getNumericValue(summarySheet, aoePaidRow, itdColIdx);

    const total_lu = total_loss_reserves + total_loss_ibnr;
    const total_laeu = total_lae_reserves_dcc + total_lae_ibnr_dcc;
    const total_aeu = total_lae_reserves_aoe + total_lae_ibnr_aoe + total_ulae_ibnr;

    const totalItdValues = {
      pw: total_pw, pfw: 0, pc: total_pw, pfc: 0, tax: 0, lp: total_lp, laep: total_laep, ae_paid: total_ae_paid,
      pe: total_pw - total_uep, pfe: 0, uep: total_uep, lu: total_lu, laeu: total_laeu, aeu: total_aeu,
      loss_reserves: total_loss_reserves, loss_ibnr: total_loss_ibnr, lae_reserves_dcc: total_lae_reserves_dcc, lae_ibnr_dcc: total_lae_ibnr_dcc,
      lae_reserves_aoe: total_lae_reserves_aoe, lae_ibnr_aoe: total_lae_ibnr_aoe, ulae_ibnr: total_ulae_ibnr
    };

    const totalWs = this.createITDStateSheet('MTHLY-TOTAL', totalItdValues);
    XLSX.utils.book_append_sheet(outWb, totalWs, 'MTHLY-TOTAL');

    // 2. Process all state sheets
    for (const sheetName of sheetNames) {
      const cleanName = sheetName.trim();
      const isState = cleanName.length === 2;
      
      if (isState) {
        const stateSheet = workbook.Sheets[sheetName];
        if (!stateSheet) continue;

        const pw = this.getNumericValue(stateSheet, pwRow, itdColIdx);
        const uep = this.getNumericValue(stateSheet, uepRow, itdColIdx);
        
        const loss_reserves = this.getNumericValue(stateSheet, lossReservesRow, itdColIdx);
        const loss_ibnr = this.getNumericValue(stateSheet, lossIbnrRow, itdColIdx);
        const lae_reserves_dcc = this.getNumericValue(stateSheet, dccReservesRow, itdColIdx);
        const lae_ibnr_dcc = this.getNumericValue(stateSheet, dccIbnrRow, itdColIdx);
        const lae_reserves_aoe = this.getNumericValue(stateSheet, aoeReservesRow, itdColIdx);
        const lae_ibnr_aoe = this.getNumericValue(stateSheet, aoeIbnrRow, itdColIdx);
        const ulae_ibnr = this.getNumericValue(stateSheet, ulaeIbnrRow, itdColIdx);

        const lp = this.getNumericValue(stateSheet, lpRow, itdColIdx);
        const laep = this.getNumericValue(stateSheet, dccPaidRow, itdColIdx);
        const ae_paid = this.getNumericValue(stateSheet, aoePaidRow, itdColIdx);

        const lu = loss_reserves + loss_ibnr;
        const laeu = lae_reserves_dcc + lae_ibnr_dcc;
        const aeu = lae_reserves_aoe + lae_ibnr_aoe + ulae_ibnr;

        const itdValues = {
          pw, pfw: 0, pc: pw, pfc: 0, tax: 0, lp, laep, ae_paid,
          pe: pw - uep, pfe: 0, uep, lu, laeu, aeu,
          loss_reserves, loss_ibnr, lae_reserves_dcc, lae_ibnr_dcc,
          lae_reserves_aoe, lae_ibnr_aoe, ulae_ibnr
        };

        const targetSheetName = `MTHLY-${cleanName.toUpperCase()}`;
        const ws = this.createITDStateSheet(targetSheetName, itdValues);
        XLSX.utils.book_append_sheet(outWb, ws, targetSheetName);
      }
    }

    return XLSX.write(outWb, { type: 'buffer', bookType: 'xlsx' });
  }

  private createITDStateSheet(sheetName: string, itdValues: Record<string, number>) {
    const data: any[][] = [];
    for (let i = 0; i < 13; i++) {
      data.push([]);
    }
    data[3] = ['FOR THE MONTH OF', null, 'Dec-25'];
    data[11] = ['TREATY YEAR :  5/1/2020', 'Inland Marine', 'Auto Liab', 'Phys. Damage', 'TOTALS'];

    const FIELDS_LABELS = {
      pw: 'Premiums Written',
      pfw: 'Policy Fees Written',
      pc: 'Premiums Collected',
      pfc: 'Policy Fees Collected',
      tax: 'Premium Taxes',
      lp: 'Losses Paid (Net of Salvage & Subrogation)',
      laep: 'Defense & Cost Containment Expenses Paid - (ALAE)',
      ae_paid: 'Adjusting & Other Expenses Paid - (ULAE-TPA Fees)',
      pe: 'Premium Earned - YTD',
      pfe: 'Policy Fees Earned - YTD',
      uep: 'Unearned Premium Reserves ',
      lu: 'Direct Losses Unpaid ',
      laeu: 'Defense & Cost Containment Unpaid - (ALAE)',
      aeu: 'Adjusting & Other Unpaid - (ULAE-TPA Fees)',
      loss_reserves: 'Loss Reserves / Case Reserves',
      loss_ibnr: 'Loss IBNR Reserves',
      lae_reserves_dcc: 'LAE Reserves - DCC',
      lae_ibnr_dcc: 'LAE IBNR Reserves - DCC',
      lae_reserves_aoe: 'LAE Reserves - AOE',
      lae_ibnr_aoe: 'LAE IBNR Reserves - AOE',
      ulae_ibnr: 'ULAE IBNR Reserves'
    };

    const FIELDS = [
      'pw', 'pfw', 'pc', 'pfc', 'tax', 'lp', 'laep', 'ae_paid',
      'pe', 'pfe', 'uep', 'lu', 'laeu', 'aeu',
      'loss_reserves', 'loss_ibnr', 'lae_reserves_dcc', 'lae_ibnr_dcc',
      'lae_reserves_aoe', 'lae_ibnr_aoe', 'ulae_ibnr'
    ];

    FIELDS.forEach(fieldId => {
      const val = itdValues[fieldId] || 0;
      const label = FIELDS_LABELS[fieldId as keyof typeof FIELDS_LABELS];
      data.push([label, 0, 0, val, 0]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['C4'] = { t: 's', v: 'Dec-25' };
    return ws;
  }

  getDefaultMappings(program: string) {
    let mga = '1201';
    let lob = '000171';
    let lineDescSuffix = 'FUT Starlight T1 Excess';
    let cc = '000';
    let comp = '100';
    let ext = '0000';
    let sub = '';

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
    } else if (program === 'MTC Local') {
      mga = '1202';
      lob = '000212';
      lineDescSuffix = 'FUT Starlight T2 MTC Local';
    }

    return { mga, lob, lineDescSuffix, cc, comp, ext, sub };
  }

  private getDefaultRates(program: string) {
    const isExcess = program.toLowerCase().includes('excess') || 
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
        boardsCharge: 0.40,
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
        boardsCharge: 0.40,
        lossRatioCap: 2.0,
      };
    }
  }

  private async deleteAssociatedBatches(workbookId: number): Promise<void> {
    const idStr = String(workbookId);
    await this.workbookRepo.query(
      `DELETE FROM journal_entries WHERE batch_id IN (
        SELECT id FROM journal_entry_batches WHERE batch_number LIKE 'RE-' || $1 || '-%'
      )`,
      [idStr]
    );
    await this.workbookRepo.query(
      `DELETE FROM journal_entry_batches WHERE batch_number LIKE 'RE-' || $1 || '-%'`,
      [idStr]
    );
  }
}
