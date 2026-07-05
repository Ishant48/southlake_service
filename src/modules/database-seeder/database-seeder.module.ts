import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workbook } from '../workbook/entities/workbook.entity';
import { StateExhibit } from '../workbook/entities/state-exhibit.entity';
import { CashSettlement } from '../workbook/entities/cash-settlement.entity';
import { Treaty } from '../masters/entities/treaty.entity';
import { DatabaseController } from './controllers/database.controller';
import { ItdSeederService } from './services/itd-seeder.service';
import { ItdSeederDao } from './dao/itd-seeder.dao';
import { WorkbookModule } from '../workbook/workbook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workbook, StateExhibit, CashSettlement, Treaty]),
    WorkbookModule,
  ],
  controllers: [DatabaseController],
  providers: [ItdSeederService, ItdSeederDao],
  exports: [ItdSeederService],
})
export class DatabaseSeederModule {}
