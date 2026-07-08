import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ReinsuranceStatementService } from './reinsurance-statement.service';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@Controller('workbooks')
export class ReinsuranceStatementController {
  constructor(private readonly reinsuranceStatementService: ReinsuranceStatementService) {}

  @Get(':id/reinsurance-statement/:stateCode')
  @RequirePermission('reinsurance.view')
  async getReinsuranceStatement(
    @Param('id', ParseIntPipe) id: number,
    @Param('stateCode') stateCode: string,
  ) {
    return this.reinsuranceStatementService.getReinsuranceStatement(id, stateCode.toUpperCase());
  }
}
