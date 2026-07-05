import { Injectable, Logger } from '@nestjs/common';
import { ItdSeederDao } from '../dao/itd-seeder.dao';
import * as path from 'path';
import * as fs from 'fs';
import { StateExhibit } from '../../workbook/entities/state-exhibit.entity';

interface StateExhibitJson {
  stateCode: string;
  [key: string]: unknown;
}

export interface SeederFileResult {
  file: string;
  success: boolean;
  message: string;
}

export interface SeederFileStateData {
  stateCode: string;
  pw: number[];
  pfw: number[];
  pc: number[];
  pfc: number[];
  tax: number[];
  lp: number[];
  laep: number[];
  ae_paid: number[];
  pe: number[];
  pfe: number[];
  uep: number[];
  lu: number[];
  laeu: number[];
  aeu: number[];
  loss_reserves: number[];
  loss_ibnr: number[];
  lae_reserves_dcc: number[];
  lae_ibnr_dcc: number[];
  lae_reserves_aoe: number[];
  lae_ibnr_aoe: number[];
  ulae_ibnr: number[];
}

const EXHIBIT_ARRAY_FIELDS = [
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
  'loss_reserves',
  'loss_ibnr',
  'lae_reserves_dcc',
  'lae_ibnr_dcc',
  'lae_reserves_aoe',
  'lae_ibnr_aoe',
  'ulae_ibnr',
  'lu',
  'laeu',
  'aeu',
] as const;

type ExhibitArrayField = (typeof EXHIBIT_ARRAY_FIELDS)[number];

@Injectable()
export class ItdSeederService {
  private readonly logger = new Logger(ItdSeederService.name);

  constructor(private readonly itdSeederDao: ItdSeederDao) {}

  async clearAllData(): Promise<{ success: boolean; message: string }> {
    this.logger.log('Clearing all database workbook data...');
    const deleteRes = await this.itdSeederDao.deleteAllWorkbooks();

    this.logger.log(`Clear complete. Affected rows: ${deleteRes.affected}`);
    return {
      success: true,
      message: `Database successfully cleared. Workbooks deleted: ${deleteRes.affected}`,
    };
  }

  async checkItdSeeded(): Promise<{ seeded: boolean; message: string }> {
    const itdWorkbook = await this.itdSeederDao.findWorkbookByProgramSourceIn([
      { program: 'DPR APD', source: 'ITD' },
      { program: 'APD Local', source: 'ITD' },
    ]);
    return {
      seeded: !!itdWorkbook,
      message: itdWorkbook ? 'ITD data has been seeded.' : 'ITD data has not been seeded yet.',
    };
  }

  async seedItdData(): Promise<SeederFileResult[]> {
    this.logger.log('Starting ITD only database seed operation from separate state files...');

    const statesDir = path.join(process.cwd(), 'src/database/seeds/states');

    if (!fs.existsSync(statesDir)) {
      throw new Error(
        `Seeder states directory not found at ${statesDir}. Please run extraction first.`,
      );
    }

    const files = fs.readdirSync(statesDir).filter(f => f.endsWith('.json'));
    this.logger.log(`Found ${files.length} state JSON files: ${files.join(', ')}`);
    if (files.length === 0) {
      throw new Error(`No state JSON files found under ${statesDir}.`);
    }

    const programsConfig = [
      {
        program: 'DPR APD',
        mga: '2002',
        lob: '000212',
        lineDescSuffix: 'FUT Starlight T2 APD DRP',
        cc: '00',
        rates: {
          qs: 100,
          cf: 5,
          comm: 29.0,
          bb: 0.4,
          ulae: 7.0,
          xol: 2.0,
          lr: 2.0,
          lossPick: 61.1,
          laeDcc: 0.0,
          laeAoe: 3.4,
          boardsCharge: 0.4,
          lossRatioCap: 2.0,
        },
      },
      {
        program: 'APD (Local)',
        mga: '1202',
        lob: '000212',
        lineDescSuffix: 'FUT Starlight T2 APD Local',
        cc: '000',
        rates: {
          qs: 100,
          cf: 5,
          comm: 29.0,
          bb: 0.4,
          ulae: 7.0,
          xol: 2.0,
          lr: 2.0,
          lossPick: 61.1,
          laeDcc: 0.0,
          laeAoe: 3.4,
          boardsCharge: 0.4,
          lossRatioCap: 2.0,
        },
      },
    ];

    const results: SeederFileResult[] = [];

    for (const config of programsConfig) {
      // Create dynamically in Treaty table if doesn't exist
      let treaty = await this.itdSeederDao.findTreatyByName(config.program);
      if (!treaty) {
        treaty = this.itdSeederDao.createTreaty({
          name: config.program,
          treatyCode: config.program.toUpperCase().replace(/\s+/g, '_'),
          qsPct: config.rates.qs,
          cfPct: config.rates.cf,
          commPct: config.rates.comm,
          bbPct: config.rates.bb,
          ulaePct: config.rates.ulae,
          xolPct: config.rates.xol,
          lrCapPct: config.rates.lr,
          ibnrPct: config.rates.lossPick,
        });
        await this.itdSeederDao.saveTreaty(treaty);
      }

      // Remove only existing ITD workbooks for this program to avoid conflicts
      const existingItd = await this.itdSeederDao.findWorkbooksByProgramAndSource(
        config.program,
        'ITD',
      );
      if (existingItd.length > 0) {
        this.logger.log(
          `Removing ${existingItd.length} existing ITD workbook(s) for ${config.program}...`,
        );
        await this.itdSeederDao.removeWorkbooks(existingItd);
      }

      // Create single Workbook entity for December 2025 representing the ITD values
      const workbook = this.itdSeederDao.createWorkbook({
        program: config.program,
        monthKey: '2025-12',
        monthLabel: 'December 2025',
        source: 'ITD',
        rates: config.rates,
        mga: config.mga,
        lob: config.lob,
        lineDescSuffix: config.lineDescSuffix,
        cc: config.cc,
        comp: '100',
        ext: '0000',
        sub: '',
      });

      const savedWb = await this.itdSeederDao.saveWorkbook(workbook);
      this.logger.log(`Created ITD workbook for ${config.program} with ID: ${savedWb.id}`);

      const exhibits: StateExhibit[] = [];
      for (const file of files) {
        const filePath = path.join(statesDir, file);
        const exJson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as StateExhibitJson;

        const safeNumArr = (field: string): number[] => {
          const val = exJson[field];
          if (Array.isArray(val) && val.length === 3) {
            return (val as unknown[]).map(v => Number(v) || 0);
          }
          return [0, 0, 0];
        };

        const ex = this.itdSeederDao.createStateExhibit({
          workbookId: savedWb.id,
          stateCode: exJson.stateCode,
          pw: safeNumArr('pw'),
          pfw: safeNumArr('pfw'),
          pc: safeNumArr('pc'),
          pfc: safeNumArr('pfc'),
          tax: safeNumArr('tax'),
          lp: safeNumArr('lp'),
          laep: safeNumArr('laep'),
          ae_paid: safeNumArr('ae_paid'),
          pe: safeNumArr('pe'),
          pfe: safeNumArr('pfe'),
          uep: safeNumArr('uep'),
          lu: safeNumArr('lu'),
          laeu: safeNumArr('laeu'),
          aeu: safeNumArr('aeu'),
          loss_reserves: safeNumArr('loss_reserves'),
          loss_ibnr: safeNumArr('loss_ibnr'),
          lae_reserves_dcc: safeNumArr('lae_reserves_dcc'),
          lae_ibnr_dcc: safeNumArr('lae_ibnr_dcc'),
          lae_reserves_aoe: safeNumArr('lae_reserves_aoe'),
          lae_ibnr_aoe: safeNumArr('lae_ibnr_aoe'),
          ulae_ibnr: safeNumArr('ulae_ibnr'),
        });

        exhibits.push(ex);
      }

      this.logger.log(`Saving ${exhibits.length} exhibits to database...`);
      const savedExhibits = await this.itdSeederDao.saveStateExhibits(exhibits);
      this.logger.log(`Successfully saved ${savedExhibits.length} exhibits`);

      // Create Cash Settlement
      const cs = this.itdSeederDao.createCashSettlement({
        workbookId: savedWb.id,
        begBal: 0,
        amtPaid: 0,
      });
      await this.itdSeederDao.saveCashSettlement(cs);

      // Verify data by re-fetching
      const verifyWb = await this.itdSeederDao.findWorkbookByIdWithExhibits(savedWb.id);
      this.logger.log(
        `Verification: ITD workbook for ${config.program} has ${verifyWb?.stateExhibits?.length ?? 0} exhibits`,
      );

      results.push({
        file: `${config.program} - 2025-12`,
        success: true,
        message: `Successfully seeded ITD workbook with ${savedExhibits.length} separate state JSON files.`,
      });
    }

    return results;
  }

  async getSeederFiles(): Promise<{ stateCode: string; data: SeederFileStateData }[]> {
    let itdWorkbook = await this.itdSeederDao.findWorkbookByProgramAndSourceWithExhibits(
      'APD Local',
      'ITD',
    );

    itdWorkbook ??= await this.itdSeederDao.findWorkbookBySourceWithExhibits('ITD');

    if (!itdWorkbook?.stateExhibits || itdWorkbook.stateExhibits.length === 0) {
      this.logger.log('No database ITD workbook found.');
      return [];
    }

    this.logger.log(`Loading ITD editor state data from database workbook ID: ${itdWorkbook.id}`);

    const results = itdWorkbook.stateExhibits.map(ex => {
      const data: SeederFileStateData = {
        stateCode: ex.stateCode,
        pw: ex.pw ?? [0, 0, 0],
        pfw: ex.pfw ?? [0, 0, 0],
        pc: ex.pc ?? [0, 0, 0],
        pfc: ex.pfc ?? [0, 0, 0],
        tax: ex.tax ?? [0, 0, 0],
        lp: ex.lp ?? [0, 0, 0],
        laep: ex.laep ?? [0, 0, 0],
        ae_paid: ex.ae_paid ?? [0, 0, 0],
        pe: ex.pe ?? [0, 0, 0],
        pfe: ex.pfe ?? [0, 0, 0],
        uep: ex.uep ?? [0, 0, 0],
        lu: ex.lu ?? [0, 0, 0],
        laeu: ex.laeu ?? [0, 0, 0],
        aeu: ex.aeu ?? [0, 0, 0],
        loss_reserves: ex.loss_reserves ?? [0, 0, 0],
        loss_ibnr: ex.loss_ibnr ?? [0, 0, 0],
        lae_reserves_dcc: ex.lae_reserves_dcc ?? [0, 0, 0],
        lae_ibnr_dcc: ex.lae_ibnr_dcc ?? [0, 0, 0],
        lae_reserves_aoe: ex.lae_reserves_aoe ?? [0, 0, 0],
        lae_ibnr_aoe: ex.lae_ibnr_aoe ?? [0, 0, 0],
        ulae_ibnr: ex.ulae_ibnr ?? [0, 0, 0],
      };
      return {
        stateCode: ex.stateCode,
        data,
      };
    });

    results.sort((a, b) => {
      if (a.stateCode === 'TOTAL') return 1;
      if (b.stateCode === 'TOTAL') return -1;
      return a.stateCode.localeCompare(b.stateCode);
    });

    return results;
  }

  async updateSeederFile(
    stateCode: string,
    data: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string }> {
    const cleanState = stateCode.toUpperCase().trim();

    const itdWorkbooks = await this.itdSeederDao.findWorkbooksBySourceWithExhibits('ITD');

    if (itdWorkbooks.length === 0) {
      return {
        success: false,
        message: `No active ITD workbook found in the database. Please upload an ITD Excel workbook first.`,
      };
    }

    for (const itdWorkbook of itdWorkbooks) {
      const safeNumArr = (field: string): number[] => {
        const val = data[field];
        if (Array.isArray(val) && val.length === 3) {
          return (val as unknown[]).map(v => Number(v) || 0);
        }
        return [0, 0, 0];
      };

      let exhibit = itdWorkbook.stateExhibits.find(e => e.stateCode === cleanState);
      exhibit ??= this.itdSeederDao.createStateExhibit({
        workbookId: itdWorkbook.id,
        stateCode: cleanState,
      });

      EXHIBIT_ARRAY_FIELDS.forEach((f: ExhibitArrayField) => {
        exhibit[f] = safeNumArr(f);
      });

      await this.itdSeederDao.saveStateExhibits(exhibit);
      await this.recalculateTotalExhibitInDb(itdWorkbook.id);
    }

    return {
      success: true,
      message: `Database ITD workbook successfully updated for state ${cleanState}.`,
    };
  }

  private async recalculateTotalExhibitInDb(workbookId: number): Promise<void> {
    const allExhibits = await this.itdSeederDao.findStateExhibitsByWorkbookId(workbookId);
    const nonTotalExhibits = allExhibits.filter(e => e.stateCode !== 'TOTAL');
    let totalExhibit = allExhibits.find(e => e.stateCode === 'TOTAL');

    totalExhibit ??= this.itdSeederDao.createStateExhibit({
      workbookId,
      stateCode: 'TOTAL',
    });

    EXHIBIT_ARRAY_FIELDS.forEach((field: ExhibitArrayField) => {
      const sums = [0, 0, 0];
      nonTotalExhibits.forEach(ex => {
        const arr = ex[field] ?? [];
        for (let i = 0; i < 3; i++) {
          sums[i] += Number(arr[i] ?? 0);
        }
      });
      for (let i = 0; i < 3; i++) {
        sums[i] = Number(sums[i].toFixed(2));
      }
      totalExhibit[field] = sums;
    });

    await this.itdSeederDao.saveStateExhibits(totalExhibit);
  }
}
