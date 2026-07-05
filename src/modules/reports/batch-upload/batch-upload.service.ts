import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JournalEntry } from '../../journal-entries/entities/journal-entry.entity';
import { WorkbookUploadService } from '../../workbook/workbook-upload/workbook-upload.service';
import { GlJournalEntriesService } from '../gl-journal-entries/gl-journal-entries.service';
import { BatchUploadDao } from './dao/batch-upload.dao';

/** Shape of the rows returned by GlJournalEntriesService.getGLJournalEntries. */
interface GlJournalEntryRow {
  desc: string;
  comp: string;
  account: string;
  cc: string;
  mga: string;
  lob: string;
  st: string;
  ext: string;
  sub: string;
  lineDesc: string;
  debit: number;
  credit: number;
  formula: string;
}

/** Uploads a workbook file and posts its generated GL journal entries into an existing manual journal entry batch. */
@Injectable()
export class BatchUploadService {
  constructor(
    private readonly dao: BatchUploadDao,
    private readonly workbookUploadService: WorkbookUploadService,
    private readonly glJournalEntriesService: GlJournalEntriesService,
  ) {}

  async uploadToBatch(batchId: string, buffer: Buffer, originalname: string, program?: string) {
    const uploadResult = (await this.workbookUploadService.uploadWorkbook(
      buffer,
      originalname,
      true,
      program,
    )) as { workbook: { id: number } };
    const workbookId = uploadResult.workbook.id;

    const manualBatch = await this.dao.findBatchById(batchId);
    if (!manualBatch) {
      throw new NotFoundException(`Journal Batch with ID ${batchId} not found`);
    }

    const glRows = (await this.glJournalEntriesService.getGLJournalEntries(
      workbookId,
      'TOTAL',
    )) as GlJournalEntryRow[];
    if (glRows.length === 0) {
      throw new BadRequestException('No journal entries generated for this workbook.');
    }

    await this.dao.deleteEntriesByBatchId(batchId);

    const entries: JournalEntry[] = [];
    const today = new Date().toISOString().split('T')[0];
    const coaList = await this.dao.findAllChartOfAccounts();

    for (let i = 0; i < glRows.length; i++) {
      const row = glRows[i];
      const accountCodeNum = parseInt(row.account);
      const coa = coaList.find(c => c.accountCode === accountCodeNum);

      if (!coa) {
        throw new BadRequestException(
          `Chart of Account with code ${row.account} does not exist. Please seed it first.`,
        );
      }

      const entry = this.dao.createEntry({
        batchId,
        jeNumber: 1,
        description: row.desc,
        coaId: coa.id,
        sub: row.sub ?? null,
        debit: row.debit > 0 ? row.debit : null,
        credit: row.credit > 0 ? row.credit : null,
        date: today,
        dp: '-',
        policy: row.lineDesc,
        memo: `Uploaded from Reinsurance Workbook ${originalname}`,
      });
      entries.push(entry);
    }

    await this.dao.saveEntries(entries);

    const totalAmount = glRows.reduce((sum, r) => sum + Number(r.debit ?? 0), 0);
    manualBatch.totalAmount = Math.round(totalAmount * 100) / 100;
    manualBatch.count = 1;
    await this.dao.saveBatch(manualBatch);

    return {
      success: true,
      batch: manualBatch,
      entries,
    };
  }
}
