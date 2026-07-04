import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkbookService } from '../services/workbook.service';
import { UpdateExhibitDto } from '../dto/update-exhibit.dto';
import { UpdateRatesDto } from '../dto/update-rates.dto';
import { UpdateCashSettlementDto } from '../dto/update-cash-settlement.dto';
import { UpdateMappingsDto } from '../dto/update-mappings.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../entities/user.entity';

@Controller('api/workbooks')
@Public()
export class WorkbookController {
  constructor(private readonly workbookService: WorkbookService) {}

  @Get()
  async findAll() {
    return this.workbookService.findAll();
  }

  @Get('programs')
  async findPrograms() {
    return this.workbookService.findPrograms();
  }

  @Post('programs')
  async createProgram(
    @Body('name') name: string,
    @Body('rates') rates: any,
  ) {
    return this.workbookService.createProgram(name, rates);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workbookService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    await this.workbookService.delete(id, user?.id);
  }

  @Put(':id/mappings')
  async updateMappings(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateMappingsDto,
  ) {
    return this.workbookService.updateMappings(id, dto);
  }

  @Put(':id/exhibits/:stateCode')
  async updateExhibit(
    @Param('id', ParseIntPipe) id: number,
    @Param('stateCode') stateCode: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateExhibitDto,
  ) {
    return this.workbookService.updateExhibit(id, stateCode.toUpperCase(), dto);
  }

  @Put(':id/rates')
  async updateRates(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateRatesDto,
    @CurrentUser() user: User,
  ) {
    return this.workbookService.updateRates(id, dto, user?.id);
  }

  @Put(':id/cash-settlement')
  async updateCashSettlement(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateCashSettlementDto,
    @CurrentUser() user: User,
  ) {
    return this.workbookService.updateCashSettlement(id, dto, user?.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body('overwrite') overwrite?: string,
    @Body('program') program?: string,
  ) {
    const forceOverwrite = overwrite === 'true';
    return this.workbookService.uploadWorkbook(file.buffer, file.originalname, forceOverwrite, program);
  }

  @Post('generate-itd')
  @UseInterceptors(FileInterceptor('file'))
  async generateITDExcel(
    @UploadedFile() file: any,
    @Body('program') program: string,
    @Res() res: any,
  ) {
    const buffer = await this.workbookService.generateITDExcel(file.buffer, program);
    const safeProgram = program ? program.replace(/\s+/g, '_') : 'Program';
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=ITD_Seeder_${safeProgram}_${file.originalname}`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('manual-itd')
  async createManualITD(@Body() body: any) {
    return this.workbookService.createManualITD(body);
  }
}
