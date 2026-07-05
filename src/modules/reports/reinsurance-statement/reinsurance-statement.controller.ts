import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ReinsuranceStatementService } from './reinsurance-statement.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('workbooks')
@Public()
export class ReinsuranceStatementController {
  constructor(private readonly reinsuranceStatementService: ReinsuranceStatementService) {}

  @Get(':id/reinsurance-statement/:stateCode')
  async getReinsuranceStatement(
    @Param('id', ParseIntPipe) id: number,
    @Param('stateCode') stateCode: string,
  ) {
    return this.reinsuranceStatementService.getReinsuranceStatement(id, stateCode.toUpperCase());
  }
}
