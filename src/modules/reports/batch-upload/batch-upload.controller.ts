import { Controller, Post, Param, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BatchUploadService } from './batch-upload.service';
import { Public } from '../../../common/decorators/public.decorator';

/** Minimal shape of a Multer-uploaded file (Express.Multer.File is not resolvable in this project). */
interface UploadedMulterFile {
  buffer: Buffer;
  originalname: string;
}

@Controller('api/workbooks')
@Public()
export class BatchUploadController {
  constructor(private readonly batchUploadService: BatchUploadService) {}

  @Post('upload-to-batch/:batchId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadToBatch(
    @Param('batchId') batchId: string,
    @UploadedFile() file: UploadedMulterFile,
    @Query('program') program?: string,
  ) {
    return this.batchUploadService.uploadToBatch(batchId, file.buffer, file.originalname, program);
  }
}
