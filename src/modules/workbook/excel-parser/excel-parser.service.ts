import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Workbook } from '../entities/workbook.entity';
import { StarlightParserService } from '../starlight-parser/starlight-parser.service';
import { FutParserService } from '../fut-parser/fut-parser.service';

/** Result of parsing a FUT-format workbook: a single created/updated workbook. */
export interface FutParseResult {
  message: string;
  workbook: Workbook;
}

/** Result of parsing a Starlight-format workbook: one workbook per reported month column. */
export interface StarlightParseResult {
  message: string;
  workbooks: Workbook[];
}

export type WorkbookParseResult = FutParseResult | StarlightParseResult;

/** Thin public entry point that detects the workbook format (Starlight vs FUT) and dispatches to the matching parser service. */
@Injectable()
export class ExcelParserService {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
    private readonly starlightParserService: StarlightParserService,
    private readonly futParserService: FutParserService,
  ) {}

  async parseWorkbook(
    fileBuffer: Buffer,
    filename: string,
    forceOverwrite: boolean = false,
    overrideProgram?: string,
  ): Promise<WorkbookParseResult> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const isStarlight = sheetNames.some(name => name.toLowerCase().includes('starlight'));

    if (isStarlight) {
      return this.starlightParserService.parseStarlightWorkbook(
        workbook,
        filename,
        forceOverwrite,
        overrideProgram,
      );
    } else {
      return this.futParserService.parseFUTWorkbook(
        workbook,
        filename,
        forceOverwrite,
        overrideProgram,
      );
    }
  }

  async deleteAssociatedBatches(workbookId: number): Promise<void> {
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
