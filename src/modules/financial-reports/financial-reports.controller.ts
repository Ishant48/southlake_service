import { Controller, Get, Query } from '@nestjs/common';
import { FinancialReportsService } from './financial-reports.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('financial-reports')
export class FinancialReportsController {
  constructor(private readonly service: FinancialReportsService) {}

  @Get('balance-sheet')
  @RequirePermission('financial_reports.view')
  async getBalanceSheet(@Query('period') period: string) {
    const targetPeriod = period || 'June 2026';
    return this.service.getBalanceSheet(targetPeriod);
  }

  @Get('pl')
  @RequirePermission('financial_reports.view')
  async getPLStatement(@Query('period') period: string) {
    const targetPeriod = period || 'June 2026';
    return this.service.getPLStatement(targetPeriod);
  }
}
