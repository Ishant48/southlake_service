import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CashSettlementService } from './cash-settlement.service';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@Controller('workbooks')
export class CashSettlementController {
  constructor(private readonly cashSettlementService: CashSettlementService) {}

  @Get(':id/cash-settlement-calculations')
  @RequirePermission('reinsurance.view')
  async getCashSettlementCalculations(
    @Param('id', ParseIntPipe) id: number,
    @Query('stateCode') stateCode?: string,
  ) {
    return this.cashSettlementService.getCashSettlementCalculations(id, stateCode);
  }
}
