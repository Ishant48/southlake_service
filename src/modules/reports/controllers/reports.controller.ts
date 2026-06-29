import { Controller, Get, Post, Param, ParseIntPipe, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from '../services/reports.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('api/workbooks')
@Public()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('upload-to-batch/:batchId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadToBatch(
    @Param('batchId') batchId: string,
    @UploadedFile() file: any,
    @Query('program') program?: string,
  ) {
    return this.reportsService.uploadToBatch(batchId, file.buffer, file.originalname, program);
  }

  @Get(':id/reinsurance-statement/:stateCode')
  async getReinsuranceStatement(
    @Param('id', ParseIntPipe) id: number,
    @Param('stateCode') stateCode: string,
  ) {
    return this.reportsService.getReinsuranceStatement(id, stateCode.toUpperCase());
  }

  @Get(':id/gl-journal-entries/:stateCode')
  async getGLJournalEntries(
    @Param('id', ParseIntPipe) id: number,
    @Param('stateCode') stateCode: string,
  ) {
    return this.reportsService.getGLJournalEntries(id, stateCode.toUpperCase());
  }

  @Post(':id/post-to-journal-entries/:stateCode')
  async postToJournalEntries(
    @Param('id', ParseIntPipe) id: number,
    @Param('stateCode') stateCode: string,
  ) {
    return this.reportsService.postToJournalEntries(id, stateCode.toUpperCase());
  }

  @Get(':id/cash-settlement-calculations')
  async getCashSettlementCalculations(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getCashSettlementCalculations(id);
  }
}
