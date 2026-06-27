import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalEntryBatch } from '../../entities/journal-entry-batch.entity';
import { JournalEntry } from '../../entities/journal-entry.entity';
import { ChartOfAccount } from '../../entities/chart-of-account.entity';
import { JournalEntriesService } from './journal-entries.service';
import { JournalEntriesController } from './journal-entries.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JournalEntryBatch,
      JournalEntry,
      ChartOfAccount,
    ]),
  ],
  controllers: [JournalEntriesController],
  providers: [JournalEntriesService],
  exports: [JournalEntriesService],
})
export class JournalEntriesModule {}
