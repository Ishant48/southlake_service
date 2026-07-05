import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalEntryBatch } from './entities/journal-entry-batch.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { ChartOfAccount } from '../chart-of-accounts/entities/chart-of-account.entity';
import { JournalEntriesService } from './journal-entries.service';
import { JournalEntriesController } from './journal-entries.controller';
import { JournalEntriesDao } from './dao/journal-entries.dao';

import { LockedPeriod } from '../masters/entities/locked-period.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JournalEntryBatch, JournalEntry, ChartOfAccount, LockedPeriod]),
  ],
  controllers: [JournalEntriesController],
  providers: [JournalEntriesService, JournalEntriesDao],
  exports: [JournalEntriesService],
})
export class JournalEntriesModule {}
