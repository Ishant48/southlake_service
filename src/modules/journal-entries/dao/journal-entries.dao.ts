import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntryBatch } from '../entities/journal-entry-batch.entity';
import { JournalEntry } from '../entities/journal-entry.entity';
import { ChartOfAccount } from '../../chart-of-accounts/entities/chart-of-account.entity';
import { LockedPeriod } from '../../masters/entities/locked-period.entity';

@Injectable()
export class JournalEntriesDao {
  constructor(
    @InjectRepository(JournalEntryBatch)
    private readonly batchRepo: Repository<JournalEntryBatch>,
    @InjectRepository(JournalEntry)
    private readonly entryRepo: Repository<JournalEntry>,
    @InjectRepository(ChartOfAccount)
    private readonly coaRepo: Repository<ChartOfAccount>,
    @InjectRepository(LockedPeriod)
    private readonly lockedPeriodRepo: Repository<LockedPeriod>,
  ) {}

  findBatchesWithFilters(
    period?: string,
    agentName?: string,
    search?: string,
  ): Promise<JournalEntryBatch[]> {
    const queryBuilder = this.batchRepo.createQueryBuilder('batch');

    if (period) {
      queryBuilder.andWhere('batch.period = :period', { period });
    }

    if (agentName) {
      queryBuilder.andWhere('batch.agent_name = :agentName', { agentName });
    }

    if (search) {
      queryBuilder.andWhere('batch.batch_number ILIKE :search', { search: `%${search}%` });
    }

    queryBuilder.orderBy('batch.created_at', 'DESC');
    return queryBuilder.getMany();
  }

  findBatchById(id: string): Promise<JournalEntryBatch | null> {
    return this.batchRepo.findOne({ where: { id } });
  }

  findLockedPeriod(period: string): Promise<LockedPeriod | null> {
    return this.lockedPeriodRepo.findOne({ where: { period, isLocked: true } });
  }

  findAllBatches(): Promise<JournalEntryBatch[]> {
    return this.batchRepo.find();
  }

  findBatchByBatchNumber(batchNumber: string): Promise<JournalEntryBatch | null> {
    return this.batchRepo.findOne({ where: { batchNumber } });
  }

  createBatchEntity(data: Partial<JournalEntryBatch>): JournalEntryBatch {
    return this.batchRepo.create(data);
  }

  saveBatch(batch: JournalEntryBatch): Promise<JournalEntryBatch> {
    return this.batchRepo.save(batch);
  }

  removeBatch(batch: JournalEntryBatch): Promise<JournalEntryBatch> {
    batch.isDeleted = true;
    batch.deletedAt = new Date();
    return this.batchRepo.save(batch);
  }

  findEntriesByBatchId(batchId: string): Promise<JournalEntry[]> {
    return this.entryRepo.find({
      where: { batchId },
      relations: ['coa'],
      order: { jeNumber: 'DESC', createdAt: 'ASC' },
    });
  }

  findEntriesByBatchIdOnly(batchId: string): Promise<JournalEntry[]> {
    return this.entryRepo.find({ where: { batchId } });
  }

  findChartOfAccountById(id: string): Promise<ChartOfAccount | null> {
    return this.coaRepo.findOne({ where: { id } });
  }

  deleteEntriesByBatchAndJeNumber(batchId: string, jeNumber: number): Promise<unknown> {
    return this.entryRepo.delete({ batchId, jeNumber });
  }

  createEntryEntity(data: Partial<JournalEntry>): JournalEntry {
    return this.entryRepo.create(data);
  }

  saveEntry(entry: JournalEntry): Promise<JournalEntry> {
    return this.entryRepo.save(entry);
  }
}
