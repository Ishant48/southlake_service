import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { Request, Response } from 'express';
import { MgasService } from './mgas.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateMgaDto, UpdateMgaDto } from '../dto/mga.dto';

interface UploadedMulterFile {
  filename: string;
  originalname: string;
}

type MulterFilenameCallback = (error: Error | null, filename: string) => void;

interface MulterDiskStorageOptions {
  destination: string;
  filename: (req: Request, file: UploadedMulterFile, cb: MulterFilenameCallback) => void;
}

const diskStorage: (options: MulterDiskStorageOptions) => unknown = (
  multer as unknown as { diskStorage: (options: MulterDiskStorageOptions) => unknown }
).diskStorage;

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class MgasController {
  constructor(private readonly service: MgasService) {}

  @Get('mgas')
  @ApiOperation({ summary: 'Get all MGAs' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllMgas(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllMgas(search, active);
  }

  @Get('mgas/:id')
  @ApiOperation({ summary: 'Get one MGA with documents' })
  findOneMga(@Param('id') id: string) {
    return this.service.findOneMga(id);
  }

  @Post('mgas')
  @ApiOperation({ summary: 'Create MGA' })
  createMga(@Body() dto: CreateMgaDto, @CurrentUser() user: User) {
    return this.service.createMga(dto, user.id);
  }

  @Patch('mgas/:id')
  @ApiOperation({ summary: 'Update MGA' })
  updateMga(@Param('id') id: string, @Body() dto: UpdateMgaDto, @CurrentUser() user: User) {
    return this.service.updateMga(id, dto, user.id);
  }

  @Delete('mgas/:id')
  @ApiOperation({ summary: 'Delete MGA' })
  deleteMga(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.deleteMga(id, user.id);
  }

  @Post('mgas/:id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file: UploadedMulterFile, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `mga-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload MGA attachment document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadMgaDocument(
    @Param('id') id: string,
    @UploadedFile() file: UploadedMulterFile,
    @Body('document_type') documentType: string,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!documentType) {
      throw new BadRequestException('Document Type is required');
    }
    return this.service.addMgaDocument(id, file.originalname, file.filename, documentType, user.id);
  }

  @Get('mgas/documents/download/:filename')
  @ApiOperation({ summary: 'Download MGA document' })
  downloadMgaDocument(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Document file not found on disk');
    }
    return res.sendFile(filePath);
  }

  @Delete('mgas/documents/:docId')
  @ApiOperation({ summary: 'Delete MGA document' })
  async deleteMgaDocument(@Param('docId') docId: string) {
    const doc = await this.service.findMgaDocument(docId);
    const filePath = join(process.cwd(), 'uploads', doc.fileUrl);

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // ignore unlink error, clear db anyway
    }

    return this.service.deleteMgaDocument(docId);
  }

  @Post('mgas/:id/add-to-treaties')
  @ApiOperation({ summary: 'Add MGA to multiple treaties' })
  async addMgaToTreaties(
    @Param('id') id: string,
    @Body('treaty_ids') treatyIds: string[],
    @CurrentUser() user: User,
  ) {
    return this.service.addMgaToTreaties(id, treatyIds, user.id);
  }
}
