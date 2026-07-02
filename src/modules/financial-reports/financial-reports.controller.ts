import { Controller, Get, Query } from '@nestjs/common';
import { FinancialReportsService } from './financial-reports.service';

@Controller('financial-reports')
export class FinancialReportsController {
  constructor(private readonly service: FinancialReportsService) {}

  @Get('balance-sheet')
  async getBalanceSheet(@Query('period') period: string) {
    const targetPeriod = period || 'June 2026';
    return this.service.getBalanceSheet(targetPeriod);
  }

  @Get('pl')
  async getPLStatement(@Query('period') period: string) {
    const targetPeriod = period || 'June 2026';
    return this.service.getPLStatement(targetPeriod);
  }
}
