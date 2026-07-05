import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workbook } from './entities/workbook.entity';
import { StateExhibit } from './entities/state-exhibit.entity';
import { CashSettlement } from './entities/cash-settlement.entity';
import { Treaty } from '../masters/entities/treaty.entity';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { ParsingHelpersService } from './parsing-helpers/parsing-helpers.service';

import { StarlightParserService } from './starlight-parser/starlight-parser.service';
import { FutParserService } from './fut-parser/fut-parser.service';
import { ItdGeneratorService } from './itd-generator/itd-generator.service';
import { ExcelParserService } from './excel-parser/excel-parser.service';

import { WorkbooksController } from './workbooks/workbooks.controller';
import { WorkbooksService } from './workbooks/workbooks.service';
import { WorkbooksDao } from './workbooks/dao';

import { WorkbookUploadController } from './workbook-upload/workbook-upload.controller';
import { WorkbookUploadService } from './workbook-upload/workbook-upload.service';
import { WorkbookUploadDao } from './workbook-upload/dao';

import { WorkbookUpdatesController } from './workbook-updates/workbook-updates.controller';
import { WorkbookUpdatesService } from './workbook-updates/workbook-updates.service';
import { WorkbookUpdatesDao } from './workbook-updates/dao';

import { WorkbookLookupsService } from './workbook-lookups/workbook-lookups.service';
import { WorkbookLookupsDao } from './workbook-lookups/dao';

import { FutReservesService } from './fut-reserves/fut-reserves.service';
import { FutReservesDao } from './fut-reserves/dao';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workbook, StateExhibit, CashSettlement, Treaty]),
    ActivityLogsModule,
  ],
  controllers: [WorkbooksController, WorkbookUploadController, WorkbookUpdatesController],
  providers: [
    ParsingHelpersService,
    StarlightParserService,
    FutParserService,
    ItdGeneratorService,
    ExcelParserService,
    WorkbooksDao,
    WorkbooksService,
    WorkbookUploadDao,
    WorkbookUploadService,
    WorkbookUpdatesDao,
    WorkbookUpdatesService,
    WorkbookLookupsDao,
    WorkbookLookupsService,
    FutReservesDao,
    FutReservesService,
  ],
  exports: [
    WorkbooksService,
    WorkbookUploadService,
    WorkbookUpdatesService,
    WorkbookLookupsService,
    FutReservesService,
    ExcelParserService,
  ],
})
export class WorkbookModule {}
