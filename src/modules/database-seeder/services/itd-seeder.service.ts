import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../../entities/workbook.entity';
import { StateExhibit } from '../../../entities/state-exhibit.entity';
import { CashSettlement } from '../../../entities/cash-settlement.entity';
import { Treaty } from '../../../entities/treaty.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ItdSeederService {
  private readonly logger = new Logger(ItdSeederService.name);

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

  async clearAllData(): Promise<{ success: boolean; message: string }> {
    this.logger.log('Clearing all database workbook data...');
    const deleteRes = await this.workbookRepo
      .createQueryBuilder()
      .delete()
      .execute();

    this.logger.log(`Clear complete. Affected rows: ${deleteRes.affected}`);
    return {
      success: true,
      message: `Database successfully cleared. Workbooks deleted: ${deleteRes.affected}`,
    };
  }

  async checkItdSeeded(): Promise<{ seeded: boolean; message: string }> {
    const itdWorkbook = await this.workbookRepo.findOne({
      where: [
        { program: 'DPR APD', source: 'ITD' },
        { program: 'APD Local', source: 'ITD' },
      ],
    });
    return {
      seeded: !!itdWorkbook,
      message: itdWorkbook ? 'ITD data has been seeded.' : 'ITD data has not been seeded yet.',
    };
  }

  async seedItdData(): Promise<any[]> {
    this.logger.log('Starting ITD only database seed operation from separate state files...');
    
    const statesDir = path.join(process.cwd(), 'src/database/seeds/states');

    if (!fs.existsSync(statesDir)) {
      throw new Error(`Seeder states directory not found at ${statesDir}. Please run extraction first.`);
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
          bb: 0.40,
          ulae: 7.0,
          xol: 2.0,
          lr: 2.0,
          lossPick: 61.1,
          laeDcc: 0.0,
          laeAoe: 3.4,
          boardsCharge: 0.40,
          lossRatioCap: 2.0
        }
      },
      {
        program: 'APD Local',
        mga: '1202',
        lob: '000212',
        lineDescSuffix: 'FUT Starlight T2 APD Local',
        cc: '000',
        rates: {
          qs: 100,
          cf: 5,
          comm: 29.0,
          bb: 0.40,
          ulae: 7.0,
          xol: 2.0,
          lr: 2.0,
          lossPick: 61.1,
          laeDcc: 0.0,
          laeAoe: 3.4,
          boardsCharge: 0.40,
          lossRatioCap: 2.0
        }
      }
    ];

    const results = [];

    for (const config of programsConfig) {
      // Create dynamically in Treaty table if doesn't exist
      let treaty = await this.treatyRepo.findOne({ where: { name: config.program } });
      if (!treaty) {
        treaty = this.treatyRepo.create({
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
        await this.treatyRepo.save(treaty);
      }

      // Remove only existing ITD workbooks for this program to avoid conflicts
      const existingItd = await this.workbookRepo.find({ where: { program: config.program, source: 'ITD' } });
      if (existingItd.length > 0) {
        this.logger.log(`Removing ${existingItd.length} existing ITD workbook(s) for ${config.program}...`);
        await this.workbookRepo.remove(existingItd);
      }

      // Create single Workbook entity for December 2025 representing the ITD values
      const workbook = this.workbookRepo.create({
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

      const savedWb = await this.workbookRepo.save(workbook);
      this.logger.log(`Created ITD workbook for ${config.program} with ID: ${savedWb.id}`);

      const exhibits = [];
      for (const file of files) {
        const filePath = path.join(statesDir, file);
        const exJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const safeNumArr = (field: string): number[] => {
          const val = exJson[field];
          if (Array.isArray(val) && val.length === 3) {
            return val.map(v => Number(v) || 0);
          }
          return [0, 0, 0];
        };

        const ex = this.stateExhibitRepo.create({
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
      const savedExhibits = await this.stateExhibitRepo.save(exhibits);
      this.logger.log(`Successfully saved ${savedExhibits.length} exhibits`);

      // Create Cash Settlement
      const cs = this.cashSettlementRepo.create({
        workbookId: savedWb.id,
        begBal: 0,
        amtPaid: 0,
      });
      await this.cashSettlementRepo.save(cs);

      // Verify data by re-fetching
      const verifyWb = await this.workbookRepo.findOne({
        where: { id: savedWb.id },
        relations: { stateExhibits: true },
      });
      this.logger.log(`Verification: ITD workbook for ${config.program} has ${verifyWb?.stateExhibits?.length || 0} exhibits`);

      results.push({
        file: `${config.program} - 2025-12`,
        success: true,
        message: `Successfully seeded ITD workbook with ${savedExhibits.length} separate state JSON files.`
      });
    }

    return results;
  }

  async getSeederFiles(): Promise<any[]> {
    let itdWorkbook = await this.workbookRepo.findOne({
      where: { program: 'APD Local', source: 'ITD' },
      relations: { stateExhibits: true },
    });

    if (!itdWorkbook) {
      itdWorkbook = await this.workbookRepo.findOne({
        where: { source: 'ITD' },
        relations: { stateExhibits: true },
      });
    }

    if (!itdWorkbook || !itdWorkbook.stateExhibits || itdWorkbook.stateExhibits.length === 0) {
      this.logger.log('No database ITD workbook found.');
      return [];
    }

    this.logger.log(`Loading ITD editor state data from database workbook ID: ${itdWorkbook.id}`);
    
    const results = itdWorkbook.stateExhibits.map((ex) => {
      const data: any = {
        stateCode: ex.stateCode,
        pw: ex.pw || [0, 0, 0],
        pfw: ex.pfw || [0, 0, 0],
        pc: ex.pc || [0, 0, 0],
        pfc: ex.pfc || [0, 0, 0],
        tax: ex.tax || [0, 0, 0],
        lp: ex.lp || [0, 0, 0],
        laep: ex.laep || [0, 0, 0],
        ae_paid: ex.ae_paid || [0, 0, 0],
        pe: ex.pe || [0, 0, 0],
        pfe: ex.pfe || [0, 0, 0],
        uep: ex.uep || [0, 0, 0],
        lu: ex.lu || [0, 0, 0],
        laeu: ex.laeu || [0, 0, 0],
        aeu: ex.aeu || [0, 0, 0],
        loss_reserves: ex.loss_reserves || [0, 0, 0],
        loss_ibnr: ex.loss_ibnr || [0, 0, 0],
        lae_reserves_dcc: ex.lae_reserves_dcc || [0, 0, 0],
        lae_ibnr_dcc: ex.lae_ibnr_dcc || [0, 0, 0],
        lae_reserves_aoe: ex.lae_reserves_aoe || [0, 0, 0],
        lae_ibnr_aoe: ex.lae_ibnr_aoe || [0, 0, 0],
        ulae_ibnr: ex.ulae_ibnr || [0, 0, 0],
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

  async updateSeederFile(stateCode: string, data: any): Promise<{ success: boolean; message: string }> {
    const cleanState = stateCode.toUpperCase().trim();

    const itdWorkbooks = await this.workbookRepo.find({
      where: { source: 'ITD' },
      relations: { stateExhibits: true },
    });

    if (itdWorkbooks.length === 0) {
      return {
        success: false,
        message: `No active ITD workbook found in the database. Please upload an ITD Excel workbook first.`,
      };
    }

    for (const itdWorkbook of itdWorkbooks) {
      const fields = [
        'pw', 'pfw', 'pc', 'pfc', 'tax', 'lp', 'laep', 'ae_paid',
        'pe', 'pfe', 'uep', 'loss_reserves', 'loss_ibnr', 
        'lae_reserves_dcc', 'lae_ibnr_dcc', 'lae_reserves_aoe', 'lae_ibnr_aoe', 'ulae_ibnr',
        'lu', 'laeu', 'aeu'
      ];

      const safeNumArr = (field: string): number[] => {
        const val = data[field];
        if (Array.isArray(val) && val.length === 3) {
          return val.map(v => Number(v) || 0);
        }
        return [0, 0, 0];
      };

      let exhibit = itdWorkbook.stateExhibits.find(e => e.stateCode === cleanState);
      if (!exhibit) {
        exhibit = this.stateExhibitRepo.create({
          workbookId: itdWorkbook.id,
          stateCode: cleanState,
        });
      }

      fields.forEach(f => {
        (exhibit as any)[f] = safeNumArr(f);
      });

      await this.stateExhibitRepo.save(exhibit);
      await this.recalculateTotalExhibitInDb(itdWorkbook.id);
    }

    return {
      success: true,
      message: `Database ITD workbook successfully updated for state ${cleanState}.`,
    };
  }

  private async recalculateTotalExhibitInDb(workbookId: number): Promise<void> {
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
      'pe', 'pfe', 'uep', 'loss_reserves', 'loss_ibnr', 
      'lae_reserves_dcc', 'lae_ibnr_dcc', 'lae_reserves_aoe', 'lae_ibnr_aoe', 'ulae_ibnr',
      'lu', 'laeu', 'aeu'
    ];

    fields.forEach((field) => {
      const sums = [0, 0, 0];
      nonTotalExhibits.forEach((ex) => {
        const arr = (ex as any)[field] || [];
        for (let i = 0; i < 3; i++) {
          sums[i] += Number(arr[i] || 0);
        }
      });
      for (let i = 0; i < 3; i++) {
        sums[i] = Number(sums[i].toFixed(2));
      }
      (totalExhibit as any)[field] = sums;
    });

    await this.stateExhibitRepo.save(totalExhibit);
  }
}
