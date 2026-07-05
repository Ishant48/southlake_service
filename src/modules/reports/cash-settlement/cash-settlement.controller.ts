import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CashSettlementService } from './cash-settlement.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('api/workbooks')
@Public()
export class CashSettlementController {
  constructor(private readonly cashSettlementService: CashSettlementService) {}

  @Get(':id/cash-settlement-calculations')
  async getCashSettlementCalculations(
    @Param('id', ParseIntPipe) id: number,
    @Query('stateCode') stateCode?: string,
  ) {
    return this.cashSettlementService.getCashSettlementCalculations(id, stateCode);
  }
}
