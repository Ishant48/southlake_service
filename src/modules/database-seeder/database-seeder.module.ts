import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workbook } from '../../entities/workbook.entity';
import { StateExhibit } from '../../entities/state-exhibit.entity';
import { CashSettlement } from '../../entities/cash-settlement.entity';
import { Treaty } from '../../entities/treaty.entity';
import { DatabaseController } from './controllers/database.controller';
import { ItdSeederService } from './services/itd-seeder.service';
import { WorkbookModule } from '../workbook/workbook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workbook, StateExhibit, CashSettlement, Treaty]),
    WorkbookModule,
  ],
  controllers: [DatabaseController],
  providers: [ItdSeederService],
  exports: [ItdSeederService],
})
export class DatabaseSeederModule {}
