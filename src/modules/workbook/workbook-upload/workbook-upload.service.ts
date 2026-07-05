import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Workbook } from '../entities/workbook.entity';
import { StateExhibit } from '../entities/state-exhibit.entity';
import { WorkbookUploadDao } from './dao/workbook-upload.dao';
import { ExcelParserService, WorkbookParseResult } from '../excel-parser/excel-parser.service';
import { ItdGeneratorService } from '../itd-generator/itd-generator.service';
import { FutReservesService } from '../fut-reserves/fut-reserves.service';
import { FutParserService } from '../fut-parser/fut-parser.service';
import { WorkbooksService } from '../workbooks/workbooks.service';

/** A single manually-entered state exhibit row within a manual ITD payload. */
export interface ManualItdExhibitDto {
  state_code: string;
  uep?: number;
  loss_reserves?: number;
  loss_ibnr?: number;
  lae_reserves_dcc?: number;
  lae_ibnr_dcc?: number;
  lae_reserves_aoe?: number;
  lae_ibnr_aoe?: number;
  ulae_ibnr?: number;
}

/** JSON payload for manually creating/updating an ITD baseline workbook without an uploaded file. */
export interface ManualItdDto {
  program: string;
  monthKey: string;
  monthLabel: string;
  exhibits: ManualItdExhibitDto[];
}

/** Handles workbook ingestion: uploading raw XLSX (Starlight or FUT), generating an ITD baseline file from Starlight, and manual ITD creation via JSON payload. */
@Injectable()
export class WorkbookUploadService {
  constructor(
    private readonly dao: WorkbookUploadDao,
    private readonly excelParserService: ExcelParserService,
    private readonly itdGeneratorService: ItdGeneratorService,
    private readonly futReservesService: FutReservesService,
    private readonly futParserService: FutParserService,
    private readonly workbooksService: WorkbooksService,
  ) {}

  async uploadWorkbook(
    fileBuffer: Buffer,
    filename: string,
    forceOverwrite: boolean = false,
    program?: string,
  ): Promise<WorkbookParseResult> {
    let finalBuffer = fileBuffer;
    let finalFilename = filename;

    // Auto-detect and convert Starlight to ITD baseline if forceOverwrite (Add ITD) is triggered
    if (forceOverwrite) {
      try {
        const tempWb = XLSX.read(fileBuffer, { type: 'buffer' });
        const isStarlight = tempWb.SheetNames.some(name =>
          name.toLowerCase().includes('starlight'),
        );
        if (isStarlight) {
          finalBuffer = this.itdGeneratorService.generateITDWorkbookFromStarlight(fileBuffer);
          finalFilename = `ITD_Seeder_${filename}`;
        }
      } catch (err) {
        console.warn('Starlight to ITD auto-detection failed:', err);
      }
    }

    const result = await this.excelParserService.parseWorkbook(
      finalBuffer,
      finalFilename,
      forceOverwrite,
      program,
    );
    if ('workbook' in result && result.workbook.source === 'FUT') {
      await this.futReservesService.recalculateFUTReserves(result.workbook.id);
      result.workbook = await this.workbooksService.findOne(result.workbook.id);
    }
    return result;
  }

  generateITDExcel(fileBuffer: Buffer, _program?: string): Buffer {
    return this.itdGeneratorService.generateITDWorkbookFromStarlight(fileBuffer);
  }

  async createManualITD(dto: ManualItdDto): Promise<Workbook> {
    const { program, monthKey, monthLabel, exhibits } = dto;
    const source = 'ITD';

    // Find if workbook exists
    let workbook = await this.dao.findWorkbookWithExhibits(program, monthKey, source);

    const treaty = await this.dao.findTreatyByName(program);
    const rates = {
      qs: treaty?.qsPct != null ? Number(treaty.qsPct) : 100,
      cf: treaty?.cfPct != null ? Number(treaty.cfPct) : 5,
      comm: treaty?.commPct != null ? Number(treaty.commPct) : 29,
      bb: treaty?.bbPct != null ? Number(treaty.bbPct) : 0.4,
      ulae: treaty?.ulaePct != null ? Number(treaty.ulaePct) : 7,
      xol: treaty?.xolPct != null ? Number(treaty.xolPct) : 0,
      lr: treaty?.lrCapPct != null ? Number(treaty.lrCapPct) : 2.0,

      lossPick: treaty?.ibnrPct != null ? Number(treaty.ibnrPct) : 5.0,
      boardsCharge: treaty?.bbPct != null ? Number(treaty.bbPct) : 0.4,
      lossRatioCap: treaty?.lrCapPct != null ? Number(treaty.lrCapPct) : 2.0,
      laeDcc: treaty?.laeDccPct != null ? Number(treaty.laeDccPct) : 0.0,
      laeAoe: treaty?.laeAoePct != null ? Number(treaty.laeAoePct) : 3.4,
    };

    if (!workbook) {
      workbook = this.dao.createWorkbook({
        program,
        monthKey,
        monthLabel,
        source,
        rates,
        ...this.futParserService.getDefaultMappings(program),
      });
      workbook = await this.dao.saveWorkbook(workbook);
      workbook.stateExhibits = [];
    } else {
      workbook.rates = rates;
      workbook = await this.dao.saveWorkbook(workbook);
    }

    const savedExhibits: StateExhibit[] = [];
    for (const ex of exhibits) {
      let stateEx = workbook.stateExhibits.find(se => se.stateCode === ex.state_code.toUpperCase());

      const getArrayValue = (
        payloadVal: number | undefined,
        currentVal: number[] | null,
      ): number[] => {
        if (payloadVal !== undefined && payloadVal !== null) {
          const num = Number(payloadVal);
          return [0, num, num];
        }
        return currentVal ?? [0, 0, 0];
      };

      if (stateEx) {
        stateEx.uep = getArrayValue(ex.uep, stateEx.uep);
        stateEx.loss_reserves = getArrayValue(ex.loss_reserves, stateEx.loss_reserves);
        stateEx.lu = getArrayValue(ex.loss_reserves, stateEx.lu);
        stateEx.loss_ibnr = getArrayValue(ex.loss_ibnr, stateEx.loss_ibnr);
        stateEx.lae_reserves_dcc = getArrayValue(ex.lae_reserves_dcc, stateEx.lae_reserves_dcc);
        stateEx.lae_ibnr_dcc = getArrayValue(ex.lae_ibnr_dcc, stateEx.lae_ibnr_dcc);
        stateEx.lae_reserves_aoe = getArrayValue(ex.lae_reserves_aoe, stateEx.lae_reserves_aoe);
        stateEx.lae_ibnr_aoe = getArrayValue(ex.lae_ibnr_aoe, stateEx.lae_ibnr_aoe);
        stateEx.ulae_ibnr = getArrayValue(ex.ulae_ibnr, stateEx.ulae_ibnr);
      } else {
        stateEx = this.dao.createExhibit({
          workbookId: workbook.id,
          stateCode: ex.state_code.toUpperCase(),
          pw: [0, 0, 0],
          pfw: [0, 0, 0],
          pc: [0, 0, 0],
          pfc: [0, 0, 0],
          tax: [0, 0, 0],
          lp: [0, 0, 0],
          laep: [0, 0, 0],
          ae_paid: [0, 0, 0],
          pe: [0, 0, 0],
          pfe: [0, 0, 0],
          uep: getArrayValue(ex.uep, null),
          lu: getArrayValue(ex.loss_reserves, null),
          laeu: [0, 0, 0],
          aeu: [0, 0, 0],
          loss_reserves: getArrayValue(ex.loss_reserves, null),
          loss_ibnr: getArrayValue(ex.loss_ibnr, null),
          lae_reserves_dcc: getArrayValue(ex.lae_reserves_dcc, null),
          lae_ibnr_dcc: getArrayValue(ex.lae_ibnr_dcc, null),
          lae_reserves_aoe: getArrayValue(ex.lae_reserves_aoe, null),
          lae_ibnr_aoe: getArrayValue(ex.lae_ibnr_aoe, null),
          ulae_ibnr: getArrayValue(ex.ulae_ibnr, null),
        });
      }
      savedExhibits.push(stateEx);
    }
    await this.dao.saveExhibits(savedExhibits);
    await this.futParserService.recalculateTotalExhibit(workbook.id);

    return this.workbooksService.findOne(workbook.id);
  }
}
