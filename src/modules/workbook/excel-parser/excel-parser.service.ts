import * as path from 'path';
import { Worker } from 'worker_threads';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type * as XLSXType from 'xlsx';
import { Workbook } from '../entities/workbook.entity';
import { StarlightParserService } from '../starlight-parser/starlight-parser.service';
import { FutParserService } from '../fut-parser/fut-parser.service';

type WorkerResult = { ok: true; workbook: XLSXType.WorkBook } | { ok: false; error: string };

/** Runs XLSX.read() on a worker thread so parsing a large workbook doesn't block the event loop for every other request. */
function parseWorkbookOffThread(buffer: Buffer): Promise<XLSXType.WorkBook> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'xlsx-parse.worker.js'), {
      workerData: { buffer },
    });

    worker.once('message', (result: WorkerResult) => {
      void worker.terminate();
      if (result.ok) {
        resolve(result.workbook);
      } else {
        reject(new InternalServerErrorException(`Failed to parse workbook: ${result.error}`));
      }
    });

    worker.once('error', err => {
      void worker.terminate();
      reject(err);
    });
  });
}

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
    const workbook = await parseWorkbookOffThread(fileBuffer);
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
