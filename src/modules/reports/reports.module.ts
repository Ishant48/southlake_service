import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkbookModule } from '../workbook/workbook.module';
import { ReservesModule } from '../reserves/reserves.module';
import { ChartOfAccount } from '../chart-of-accounts/entities/chart-of-account.entity';
import { JournalEntryBatch } from '../journal-entries/entities/journal-entry-batch.entity';
import { JournalEntry } from '../journal-entries/entities/journal-entry.entity';
import { Treaty } from '../masters/entities/treaty.entity';
import { LockedPeriod } from '../masters/entities/locked-period.entity';

import { ReinsuranceStatementController } from './reinsurance-statement/reinsurance-statement.controller';
import { ReinsuranceStatementService } from './reinsurance-statement/reinsurance-statement.service';
import { ReinsuranceStatementDao } from './reinsurance-statement/dao';

import { CashSettlementController } from './cash-settlement/cash-settlement.controller';
import { CashSettlementService } from './cash-settlement/cash-settlement.service';
import { CashSettlementDao } from './cash-settlement/dao';

import { GlJournalEntriesController } from './gl-journal-entries/gl-journal-entries.controller';
import { GlJournalEntriesService } from './gl-journal-entries/gl-journal-entries.service';
import { GlJournalEntriesDao } from './gl-journal-entries/dao';

import { BatchUploadController } from './batch-upload/batch-upload.controller';
import { BatchUploadService } from './batch-upload/batch-upload.service';
import { BatchUploadDao } from './batch-upload/dao';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChartOfAccount,
      JournalEntryBatch,
      JournalEntry,
      Treaty,
      LockedPeriod,
    ]),
    WorkbookModule,
    ReservesModule,
  ],
  controllers: [
    ReinsuranceStatementController,
    CashSettlementController,
    GlJournalEntriesController,
    BatchUploadController,
  ],
  providers: [
    ReinsuranceStatementService,
    ReinsuranceStatementDao,
    CashSettlementService,
    CashSettlementDao,
    GlJournalEntriesService,
    GlJournalEntriesDao,
    BatchUploadService,
    BatchUploadDao,
  ],
  exports: [
    ReinsuranceStatementService,
    CashSettlementService,
    GlJournalEntriesService,
    BatchUploadService,
  ],
})
export class ReportsModule {}
