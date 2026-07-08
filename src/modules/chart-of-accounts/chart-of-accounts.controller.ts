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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { Request, Response } from 'express';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { UpdateChartOfAccountDto } from './dto/update-chart-of-account.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { User } from '../users/entities/user.entity';

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

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('chart-of-accounts')
@ApiBearerAuth()
@Controller('chart-of-accounts')
export class ChartOfAccountsController {
  constructor(private readonly service: ChartOfAccountsService) {}

  @Get()
  @RequirePermission('chart_of_accounts.view')
  @ApiOperation({ summary: 'Get all chart of accounts' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  findAll(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
    // Convert string query to boolean if present
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAll(search, active);
  }

  @Get(':id')
  @RequirePermission('chart_of_accounts.view')
  @ApiOperation({ summary: 'Get a single chart of account by ID' })
  @ApiResponse({ status: 200, description: 'Account details with documents' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermission('chart_of_accounts.create')
  @ApiOperation({ summary: 'Create a new chart of account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  create(@Body() dto: CreateChartOfAccountDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermission('chart_of_accounts.edit')
  @ApiOperation({ summary: 'Update an existing chart of account' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  update(@Param('id') id: string, @Body() dto: UpdateChartOfAccountDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermission('chart_of_accounts.delete')
  @ApiOperation({ summary: 'Delete a chart of account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.delete(id, user.id);
  }

  // ==========================================
  // DOCUMENT ENDPOINTS
  // ==========================================
  @Post(':id/documents')
  @RequirePermission('chart_of_accounts.edit')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (
          req: Request,
          file: UploadedMulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an attachment to a chart of account' })
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
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  uploadDocument(
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
    return this.service.addDocument(id, file.originalname, file.filename, documentType, user.id);
  }

  @Get('documents/download/:filename')
  @RequirePermission('chart_of_accounts.view')
  @ApiOperation({ summary: 'Download an attached document' })
  downloadDocument(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Document file not found on disk');
    }
    return res.sendFile(filePath);
  }

  @Delete('documents/:docId')
  @RequirePermission('chart_of_accounts.edit')
  @ApiOperation({ summary: 'Delete a document attachment' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  async deleteDocument(@Param('docId') docId: string) {
    const doc = await this.service.findDocument(docId);
    const filePath = join(process.cwd(), 'uploads', doc.fileUrl); // fileUrl stores filename

    // Attempt filesystem deletion
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // Log error but proceed to remove database record
    }

    return this.service.deleteDocument(docId);
  }
}
