import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { WorkbookModule } from '../workbook/workbook.module';
import { ReservesModule } from '../reserves/reserves.module';
import { ChartOfAccount } from '../../entities/chart-of-account.entity';
import { JournalEntryBatch } from '../../entities/journal-entry-batch.entity';
import { JournalEntry } from '../../entities/journal-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChartOfAccount, JournalEntryBatch, JournalEntry]),
    WorkbookModule,
    ReservesModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
