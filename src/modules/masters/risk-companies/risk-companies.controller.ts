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
import { RiskCompaniesService } from './risk-companies.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateRiskCompanyDto, UpdateRiskCompanyDto } from '../dto/risk-company.dto';

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
export class RiskCompaniesController {
  constructor(private readonly service: RiskCompaniesService) {}

  @Get('risk-companies')
  @ApiOperation({ summary: 'Get all risk companies' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllRiskCompanies(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllRiskCompanies(search, active);
  }

  @Post('risk-companies')
  @ApiOperation({ summary: 'Create risk company' })
  createRiskCompany(@Body() dto: CreateRiskCompanyDto, @CurrentUser() user: User) {
    return this.service.createRiskCompany(dto, user.id);
  }

  @Patch('risk-companies/:id')
  @ApiOperation({ summary: 'Update risk company' })
  updateRiskCompany(
    @Param('id') id: string,
    @Body() dto: UpdateRiskCompanyDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateRiskCompany(id, dto, user.id);
  }

  @Delete('risk-companies/:id')
  @ApiOperation({ summary: 'Delete risk company' })
  deleteRiskCompany(@Param('id') id: string) {
    return this.service.deleteRiskCompany(id);
  }

  @Get('risk-companies/:id')
  @ApiOperation({ summary: 'Get one Risk Company with documents' })
  findOneRiskCompany(@Param('id') id: string) {
    return this.service.findOneRiskCompany(id);
  }

  @Post('risk-companies/:id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file: UploadedMulterFile, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `risk-company-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload Risk Company attachment document' })
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
  uploadRiskCompanyDocument(
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
    return this.service.addRiskCompanyDocument(
      id,
      file.originalname,
      file.filename,
      documentType,
      user.id,
    );
  }

  @Get('risk-companies/documents/download/:filename')
  @ApiOperation({ summary: 'Download Risk Company document' })
  downloadRiskCompanyDocument(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Document file not found on disk');
    }
    return res.sendFile(filePath);
  }

  @Delete('risk-companies/documents/:docId')
  @ApiOperation({ summary: 'Delete Risk Company document' })
  async deleteRiskCompanyDocument(@Param('docId') docId: string) {
    const doc = await this.service.findRiskCompanyDocument(docId);
    const filePath = join(process.cwd(), 'uploads', doc.fileUrl);

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // ignore
    }

    return this.service.deleteRiskCompanyDocument(docId);
  }
}
