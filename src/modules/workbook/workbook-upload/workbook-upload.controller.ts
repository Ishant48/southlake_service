import { Controller, Post, Body, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { WorkbookUploadService, ManualItdDto } from './workbook-upload.service';
import { Public } from '../../../common/decorators/public.decorator';

interface UploadedMulterFile {
  buffer: Buffer;
  originalname: string;
}

@Controller('api/workbooks')
@Public()
export class WorkbookUploadController {
  constructor(private readonly workbookUploadService: WorkbookUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: UploadedMulterFile,
    @Body('overwrite') overwrite?: string,
    @Body('program') program?: string,
  ) {
    const forceOverwrite = overwrite === 'true';
    return this.workbookUploadService.uploadWorkbook(
      file.buffer,
      file.originalname,
      forceOverwrite,
      program,
    );
  }

  @Post('generate-itd')
  @UseInterceptors(FileInterceptor('file'))
  generateITDExcel(
    @UploadedFile() file: UploadedMulterFile,
    @Body('program') program: string,
    @Res() res: Response,
  ) {
    const buffer = this.workbookUploadService.generateITDExcel(file.buffer, program);
    const safeProgram = program ? program.replace(/\s+/g, '_') : 'Program';
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=ITD_Seeder_${safeProgram}_${file.originalname}`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('manual-itd')
  async createManualITD(@Body() body: ManualItdDto) {
    return this.workbookUploadService.createManualITD(body);
  }
}
