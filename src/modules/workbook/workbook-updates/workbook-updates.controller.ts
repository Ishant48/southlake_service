import { Controller, Put, Param, Body, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { WorkbookUpdatesService } from './workbook-updates.service';
import { UpdateExhibitDto } from '../dto/update-exhibit.dto';
import { UpdateRatesDto } from '../dto/update-rates.dto';
import { UpdateCashSettlementDto } from '../dto/update-cash-settlement.dto';
import { UpdateMappingsDto } from '../dto/update-mappings.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('api/workbooks')
@Public()
export class WorkbookUpdatesController {
  constructor(private readonly workbookUpdatesService: WorkbookUpdatesService) {}

  @Put(':id/mappings')
  async updateMappings(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateMappingsDto,
  ) {
    return this.workbookUpdatesService.updateMappings(id, dto);
  }

  @Put(':id/exhibits/:stateCode')
  async updateExhibit(
    @Param('id', ParseIntPipe) id: number,
    @Param('stateCode') stateCode: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateExhibitDto,
  ) {
    return this.workbookUpdatesService.updateExhibit(id, stateCode.toUpperCase(), dto);
  }

  @Put(':id/rates')
  async updateRates(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateRatesDto,
    @CurrentUser() user: User,
  ) {
    return this.workbookUpdatesService.updateRates(id, dto, user?.id);
  }

  @Put(':id/cash-settlement')
  async updateCashSettlement(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateCashSettlementDto,
    @CurrentUser() user: User,
  ) {
    return this.workbookUpdatesService.updateCashSettlement(id, dto, user?.id);
  }
}
