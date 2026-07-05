import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { ChartOfAccount } from '../../../chart-of-accounts/entities/chart-of-account.entity';
import { JournalEntryBatch } from '../../../journal-entries/entities/journal-entry-batch.entity';
import { JournalEntry } from '../../../journal-entries/entities/journal-entry.entity';

@Injectable()
export class BatchUploadDao {
  constructor(
    @InjectRepository(ChartOfAccount)
    private readonly coaRepo: Repository<ChartOfAccount>,
    @InjectRepository(JournalEntryBatch)
    private readonly batchRepo: Repository<JournalEntryBatch>,
    @InjectRepository(JournalEntry)
    private readonly entryRepo: Repository<JournalEntry>,
  ) {}

  findBatchById(id: string): Promise<JournalEntryBatch | null> {
    return this.batchRepo.findOne({ where: { id } });
  }

  deleteEntriesByBatchId(batchId: string): Promise<DeleteResult> {
    return this.entryRepo.delete({ batchId });
  }

  findAllChartOfAccounts(): Promise<ChartOfAccount[]> {
    return this.coaRepo.find();
  }

  createEntry(data: Partial<JournalEntry>): JournalEntry {
    return this.entryRepo.create(data);
  }

  saveEntries(entries: JournalEntry[]): Promise<JournalEntry[]> {
    return this.entryRepo.save(entries);
  }

  saveBatch(batch: JournalEntryBatch): Promise<JournalEntryBatch> {
    return this.batchRepo.save(batch);
  }
}
