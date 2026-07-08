import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TestBalanceService } from './test-balance.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Test Balance')
@ApiBearerAuth()
@Controller('test-balance')
export class TestBalanceController {
  constructor(private readonly testBalanceService: TestBalanceService) {}

  @Get()
  @RequirePermission('test_balance.view')
  @ApiOperation({ summary: 'Get Test Balance calculations for AP and AR' })
  @ApiResponse({ status: 200, description: 'Return Test Balance card details.' })
  async getTestBalance(@Query('month') month?: string, @Query('year') year?: string) {
    const selectedMonth = month ?? 'June';
    const selectedYear = year ? Number(year) : 2026;
    return this.testBalanceService.getTestBalance(selectedMonth, selectedYear);
  }
}
