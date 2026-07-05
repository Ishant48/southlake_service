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
import { StatesService } from './states.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateStateDto, UpdateStateDto } from '../dto/state.dto';

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
export class StatesController {
  constructor(private readonly service: StatesService) {}

  @Get('states')
  @ApiOperation({ summary: 'Get all states' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllStates(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllStates(search, active);
  }

  @Post('states')
  @ApiOperation({ summary: 'Create state' })
  createState(@Body() dto: CreateStateDto, @CurrentUser() user: User) {
    return this.service.createState(dto, user.id);
  }

  @Patch('states/:id')
  @ApiOperation({ summary: 'Update state' })
  updateState(@Param('id') id: string, @Body() dto: UpdateStateDto, @CurrentUser() user: User) {
    return this.service.updateState(id, dto, user.id);
  }

  @Delete('states/:id')
  @ApiOperation({ summary: 'Delete state' })
  deleteState(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.deleteState(id, user.id);
  }

  @Get('states/:id')
  @ApiOperation({ summary: 'Get one State with documents' })
  findOneState(@Param('id') id: string) {
    return this.service.findOneState(id);
  }

  @Post('states/:id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file: UploadedMulterFile, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `state-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload State attachment document' })
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
  uploadStateDocument(
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
    return this.service.addStateDocument(
      id,
      file.originalname,
      file.filename,
      documentType,
      user.id,
    );
  }

  @Get('states/documents/download/:filename')
  @ApiOperation({ summary: 'Download State document' })
  downloadStateDocument(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Document file not found on disk');
    }
    return res.sendFile(filePath);
  }

  @Delete('states/documents/:docId')
  @ApiOperation({ summary: 'Delete State document' })
  async deleteStateDocument(@Param('docId') docId: string) {
    const doc = await this.service.findStateDocument(docId);
    const filePath = join(process.cwd(), 'uploads', doc.fileUrl);

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // ignore
    }

    return this.service.deleteStateDocument(docId);
  }
}
