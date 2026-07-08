import { Controller, Post, Param, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BatchUploadService } from './batch-upload.service';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { MAX_UPLOAD_FILE_SIZE_BYTES } from '../../workbook/workbook.constants';

/** Minimal shape of a Multer-uploaded file (Express.Multer.File is not resolvable in this project). */
interface UploadedMulterFile {
  buffer: Buffer;
  originalname: string;
}

@Controller('workbooks')
export class BatchUploadController {
  constructor(private readonly batchUploadService: BatchUploadService) {}

  @Post('upload-to-batch/:batchId')
  @RequirePermission('journal_entry.edit')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES } }))
  async uploadToBatch(
    @Param('batchId') batchId: string,
    @UploadedFile() file: UploadedMulterFile,
    @Query('program') program?: string,
  ) {
    return this.batchUploadService.uploadToBatch(batchId, file.buffer, file.originalname, program);
  }
}
