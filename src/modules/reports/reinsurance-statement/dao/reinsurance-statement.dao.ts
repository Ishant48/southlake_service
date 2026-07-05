import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccount } from '../../../chart-of-accounts/entities/chart-of-account.entity';
import { JournalEntryBatch } from '../../../journal-entries/entities/journal-entry-batch.entity';
import { Treaty } from '../../../masters/entities/treaty.entity';

export interface StateMasterRow {
  state_code: number;
  state_abbr: string;
}

@Injectable()
export class ReinsuranceStatementDao {
  constructor(
    @InjectRepository(ChartOfAccount)
    private readonly coaRepo: Repository<ChartOfAccount>,
    @InjectRepository(JournalEntryBatch)
    private readonly batchRepo: Repository<JournalEntryBatch>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  findTreatyByProgram(program: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({ where: { name: program } });
  }

  findBatchByBatchNumber(batchNumber: string): Promise<JournalEntryBatch | null> {
    return this.batchRepo.findOne({ where: { batchNumber } });
  }

  queryStateMasterByCode(stateCode: string): Promise<StateMasterRow[]> {
    return this.coaRepo.query(
      'SELECT state_code, state_abbr FROM state_master WHERE state_abbr = $1 OR state_code::text = $2',
      [stateCode, stateCode],
    );
  }
}
