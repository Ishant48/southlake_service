import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workbook } from '../../entities/workbook.entity';
import { StateExhibit } from '../../entities/state-exhibit.entity';
import { CashSettlement } from '../../entities/cash-settlement.entity';
import { Treaty } from '../../entities/treaty.entity';
import { WorkbookController } from './controllers/workbook.controller';
import { WorkbookService } from './services/workbook.service';
import { ExcelParserService } from './services/excel-parser.service';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workbook, StateExhibit, CashSettlement, Treaty]),
    ActivityLogsModule,
  ],
  controllers: [WorkbookController],
  providers: [WorkbookService, ExcelParserService],
  exports: [WorkbookService, ExcelParserService],
})
export class WorkbookModule {}
