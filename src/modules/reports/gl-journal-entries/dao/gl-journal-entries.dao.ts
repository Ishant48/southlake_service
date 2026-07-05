import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { ChartOfAccount } from '../../../chart-of-accounts/entities/chart-of-account.entity';
import { JournalEntryBatch } from '../../../journal-entries/entities/journal-entry-batch.entity';
import { JournalEntry } from '../../../journal-entries/entities/journal-entry.entity';
import { LockedPeriod } from '../../../masters/entities/locked-period.entity';

interface TreatyMgaIdRow {
  mga_id: string | null;
}

interface MgaNameRow {
  name: string;
}

@Injectable()
export class GlJournalEntriesDao {
  constructor(
    @InjectRepository(ChartOfAccount)
    private readonly coaRepo: Repository<ChartOfAccount>,
    @InjectRepository(JournalEntryBatch)
    private readonly batchRepo: Repository<JournalEntryBatch>,
    @InjectRepository(JournalEntry)
    private readonly entryRepo: Repository<JournalEntry>,
    @InjectRepository(LockedPeriod)
    private readonly lockedPeriodRepo: Repository<LockedPeriod>,
  ) {}

  findLockedPeriod(period: string): Promise<LockedPeriod | null> {
    return this.lockedPeriodRepo.findOne({ where: { period, isLocked: true } });
  }

  findBatchByBatchNumber(batchNumber: string): Promise<JournalEntryBatch | null> {
    return this.batchRepo.findOne({ where: { batchNumber } });
  }

  deleteEntriesByBatchId(batchId: string): Promise<DeleteResult> {
    return this.entryRepo.delete({ batchId });
  }

  createBatch(data: Partial<JournalEntryBatch>): JournalEntryBatch {
    return this.batchRepo.create(data);
  }

  saveBatch(batch: JournalEntryBatch): Promise<JournalEntryBatch> {
    return this.batchRepo.save(batch);
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

  queryTreatyMgaId(program: string): Promise<TreatyMgaIdRow[]> {
    return this.coaRepo.query('SELECT mga_id FROM treaties WHERE name = $1', [program]);
  }

  queryMgaName(mgaId: string): Promise<MgaNameRow[]> {
    return this.coaRepo.query('SELECT name FROM mga_master WHERE id = $1', [mgaId]);
  }
}
