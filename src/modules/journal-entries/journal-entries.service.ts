import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntryBatch } from '../../entities/journal-entry-batch.entity';
import { JournalEntry } from '../../entities/journal-entry.entity';
import { ChartOfAccount } from '../../entities/chart-of-account.entity';
import { CreateJournalBatchDto, UpdateJournalBatchDto } from './dto/journal-batches.dto';
import { PostJournalEntriesDto } from './dto/journal-entries.dto';

import { LockedPeriod } from '../../entities/locked-period.entity';

@Injectable()
export class JournalEntriesService {
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

  async findBatches(period?: string, agentName?: string, search?: string): Promise<JournalEntryBatch[]> {
    const queryBuilder = this.batchRepo.createQueryBuilder('batch');

    if (period) {
      queryBuilder.andWhere('batch.period = :period', { period });
    }

    if (agentName) {
      queryBuilder.andWhere('batch.agent_name = :agentName', { agentName });
    }

    if (search) {
      queryBuilder.andWhere(
        'batch.batch_number ILIKE :search',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('batch.created_at', 'DESC');
    return queryBuilder.getMany();
  }

  async findOneBatch(id: string): Promise<JournalEntryBatch> {
    const batch = await this.batchRepo.findOne({ where: { id } });
    if (!batch) {
      throw new NotFoundException(`Journal Batch with ID ${id} not found`);
    }
    return batch;
  }

  async createBatch(dto: CreateJournalBatchDto, userId?: string): Promise<JournalEntryBatch> {
    const locked = await this.lockedPeriodRepo.findOne({ where: { period: dto.period, isLocked: true } });
    if (locked) {
      throw new BadRequestException(`Accounting period '${dto.period}' is locked. Cannot create batch.`);
    }
    let nextBatchNumber = dto.batch_number;

    if (!nextBatchNumber) {
      const allBatches = await this.batchRepo.find();
      let maxNum = 10000;
      for (const b of allBatches) {
        const num = parseInt(b.batchNumber, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
      nextBatchNumber = (maxNum + 1).toString();
    } else {
      const existing = await this.batchRepo.findOne({ where: { batchNumber: nextBatchNumber } });
      if (existing) {
        throw new BadRequestException(`Batch number '${nextBatchNumber}' already exists`);
      }
    }

    const batch = this.batchRepo.create({
      batchNumber: nextBatchNumber,
      period: dto.period,
      agentName: dto.agent_name,
      totalAmount: 0.00,
      count: 0,
      createdBy: userId || null,
    });

    return this.batchRepo.save(batch);
  }

  async updateBatch(id: string, dto: UpdateJournalBatchDto, userId?: string): Promise<JournalEntryBatch> {
    const batch = await this.findOneBatch(id);
    const targetPeriod = dto.period || batch.period;
    const locked = await this.lockedPeriodRepo.findOne({ where: { period: targetPeriod, isLocked: true } });
    if (locked) {
      throw new BadRequestException(`Accounting period '${targetPeriod}' is locked. Cannot update batch.`);
    }

    if (dto.batch_number && dto.batch_number !== batch.batchNumber) {
      const existing = await this.batchRepo.findOne({ where: { batchNumber: dto.batch_number } });
      if (existing) {
        throw new BadRequestException(`Batch number '${dto.batch_number}' already exists`);
      }
      batch.batchNumber = dto.batch_number;
    }

    if (dto.period) batch.period = dto.period;
    if (dto.agent_name) batch.agentName = dto.agent_name;
    batch.updatedBy = userId || null;

    return this.batchRepo.save(batch);
  }

  async removeBatch(id: string): Promise<void> {
    const batch = await this.findOneBatch(id);
    const locked = await this.lockedPeriodRepo.findOne({ where: { period: batch.period, isLocked: true } });
    if (locked) {
      throw new BadRequestException(`Accounting period '${batch.period}' is locked. Cannot delete batch.`);
    }
    await this.batchRepo.remove(batch);
  }

  async findBatchEntries(batchId: string): Promise<JournalEntry[]> {
    return this.entryRepo.find({
      where: { batchId },
      relations: ['coa'],
      order: { jeNumber: 'DESC', createdAt: 'ASC' },
    });
  }

  async postEntries(batchId: string, dto: PostJournalEntriesDto): Promise<JournalEntry[]> {
    const batch = await this.findOneBatch(batchId);
    const locked = await this.lockedPeriodRepo.findOne({ where: { period: batch.period, isLocked: true } });
    if (locked) {
      throw new BadRequestException(`Accounting period '${batch.period}' is locked. Cannot post entries to this batch.`);
    }

    if (!dto.lines || dto.lines.length < 1) {
      throw new BadRequestException('At least one entry line is required');
    }

    // 1. Verify and calculate Debits/Credits
    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of dto.lines) {
      const debitVal = Number(line.debit || 0);
      const creditVal = Number(line.credit || 0);

      if (debitVal < 0 || creditVal < 0) {
        throw new BadRequestException('Debit or Credit amounts cannot be negative');
      }

      totalDebits += debitVal;
      totalCredits += creditVal;

      // Check Chart of Account exists
      const coa = await this.coaRepo.findOne({ where: { id: line.coa_id } });
      if (!coa) {
        throw new BadRequestException(`Chart of Account with ID ${line.coa_id} does not exist`);
      }
      if (coa.isParent) {
        throw new BadRequestException(`Cannot post entry to parent Chart of Account '${coa.accountCode}'`);
      }
    }

    // Round values to avoid floating point precision issues in comparison
    const roundedDebits = Math.round((totalDebits + Number.EPSILON) * 100) / 100;
    const roundedCredits = Math.round((totalCredits + Number.EPSILON) * 100) / 100;

    if (roundedDebits !== roundedCredits) {
      throw new BadRequestException(
        `Journal Entry is not balanced. Total Debits ($${roundedDebits.toFixed(2)}) must equal Total Credits ($${roundedCredits.toFixed(2)}). Difference: $${Math.abs(roundedDebits - roundedCredits).toFixed(2)}`
      );
    }

    // 2. Delete existing entries for the same je_number in this batch (Edit/Overwrite support)
    await this.entryRepo.delete({ batchId, jeNumber: dto.je_number });

    // 3. Save the entry lines
    const savedEntries: JournalEntry[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const line of dto.lines) {
      const entry = this.entryRepo.create({
        batchId,
        jeNumber: dto.je_number,
        description: line.description,
        coaId: line.coa_id,
        sub: line.sub || null,
        debit: line.debit !== undefined ? Number(line.debit) : null,
        credit: line.credit !== undefined ? Number(line.credit) : null,
        date: line.date || today,
        dp: line.dp || null,
        policy: line.policy || null,
        memo: line.memo || null,
      });

      const saved = await this.entryRepo.save(entry);
      savedEntries.push(saved);
    }

    // 3. Recalculate Batch Totals and Counts
    const allEntries = await this.entryRepo.find({ where: { batchId } });
    const batchTotalAmount = allEntries.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const distinctJeNumbers = new Set(allEntries.map(item => item.jeNumber));
    const batchCount = distinctJeNumbers.size;

    batch.totalAmount = batchTotalAmount;
    batch.count = batchCount;
    await this.batchRepo.save(batch);

    return savedEntries;
  }
}
