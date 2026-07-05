import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartOfAccount } from './entities/chart-of-account.entity';
import { ChartOfAccountDocument } from './entities/chart-of-account-document.entity';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { ChartOfAccountsController } from './chart-of-accounts.controller';
import { ChartOfAccountsDao } from './dao/chart-of-accounts.dao';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChartOfAccount, ChartOfAccountDocument]), ActivityLogsModule],
  controllers: [ChartOfAccountsController],
  providers: [ChartOfAccountsService, ChartOfAccountsDao],
  exports: [ChartOfAccountsService, ChartOfAccountsDao],
})
export class ChartOfAccountsModule {}
