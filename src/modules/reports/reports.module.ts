import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { WorkbookModule } from '../workbook/workbook.module';
import { ReservesModule } from '../reserves/reserves.module';
import { ChartOfAccount } from '../../entities/chart-of-account.entity';
import { JournalEntryBatch } from '../../entities/journal-entry-batch.entity';
import { JournalEntry } from '../../entities/journal-entry.entity';
import { Treaty } from '../../entities/treaty.entity';

import { LockedPeriod } from '../../entities/locked-period.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChartOfAccount, JournalEntryBatch, JournalEntry, Treaty, LockedPeriod]),
    WorkbookModule,
    ReservesModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
