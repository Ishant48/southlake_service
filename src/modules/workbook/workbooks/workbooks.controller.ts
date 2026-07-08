import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkbooksService, ProgramRates, ProgramSummary } from './workbooks.service';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { Treaty } from '../../masters/entities/treaty.entity';

@Controller('workbooks')
export class WorkbooksController {
  constructor(private readonly workbooksService: WorkbooksService) {}

  @Get()
  @RequirePermission('workbook.view')
  async findAll() {
    return this.workbooksService.findAll();
  }

  @Get('programs')
  @RequirePermission('workbook.view')
  async findPrograms(): Promise<ProgramSummary[]> {
    return this.workbooksService.findPrograms();
  }

  @Post('programs')
  @RequirePermission('workbook.create')
  async createProgram(
    @Body('name') name: string,
    @Body('rates') rates: ProgramRates,
  ): Promise<Treaty> {
    return this.workbooksService.createProgram(name, rates);
  }

  @Get(':id')
  @RequirePermission('workbook.view')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workbooksService.findOne(id);
  }

  @Delete(':id')
  @RequirePermission('workbook.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    await this.workbooksService.delete(id, user?.id);
  }
}
