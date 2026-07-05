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
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { Treaty } from '../../masters/entities/treaty.entity';

@Controller('workbooks')
@Public()
export class WorkbooksController {
  constructor(private readonly workbooksService: WorkbooksService) {}

  @Get()
  async findAll() {
    return this.workbooksService.findAll();
  }

  @Get('programs')
  async findPrograms(): Promise<ProgramSummary[]> {
    return this.workbooksService.findPrograms();
  }

  @Post('programs')
  async createProgram(
    @Body('name') name: string,
    @Body('rates') rates: ProgramRates,
  ): Promise<Treaty> {
    return this.workbooksService.createProgram(name, rates);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workbooksService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    await this.workbooksService.delete(id, user?.id);
  }
}
