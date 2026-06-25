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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Response } from 'express';
import { MastersService } from './masters.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

import { CreateStateDto, UpdateStateDto } from './dto/state.dto';
import { CreateMgaDto, UpdateMgaDto } from './dto/mga.dto';
import { CreateReinsurerDto, UpdateReinsurerDto } from './dto/reinsurer.dto';
import { CreateRiskCompanyDto, UpdateRiskCompanyDto } from './dto/risk-company.dto';
import { CreateLobDto, UpdateLobDto } from './dto/lob.dto';
import { CreateCobDto, UpdateCobDto } from './dto/cob.dto';
import { CreateTreatyDto, UpdateTreatyDto } from './dto/treaty.dto';

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class MastersController {
  constructor(private readonly service: MastersService) {}

  // ==========================================
  // STATE MASTER ENDPOINTS
  // ==========================================
  @Get('states')
  @ApiOperation({ summary: 'Get all states' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllStates(
    @Query('search') search?: string,
    @Query('is_active') isActive?: boolean,
  ) {
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
  updateState(
    @Param('id') id: string,
    @Body() dto: UpdateStateDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateState(id, dto, user.id);
  }

  @Delete('states/:id')
  @ApiOperation({ summary: 'Delete state' })
  deleteState(@Param('id') id: string) {
    return this.service.deleteState(id);
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
        filename: (req, file, cb) => {
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
    @UploadedFile() file: any,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.service.addStateDocument(id, file.originalname, file.filename, user.id);
  }

  @Get('states/documents/download/:filename')
  @ApiOperation({ summary: 'Download State document' })
  downloadStateDocument(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
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
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      // ignore
    }

    return this.service.deleteStateDocument(docId);
  }

  // ==========================================
  // MGA MASTER ENDPOINTS
  // ==========================================
  @Get('mgas')
  @ApiOperation({ summary: 'Get all MGAs' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllMgas(
    @Query('search') search?: string,
    @Query('is_active') isActive?: boolean,
  ) {
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
  updateMga(
    @Param('id') id: string,
    @Body() dto: UpdateMgaDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateMga(id, dto, user.id);
  }

  @Delete('mgas/:id')
  @ApiOperation({ summary: 'Delete MGA' })
  deleteMga(@Param('id') id: string) {
    return this.service.deleteMga(id);
  }

  @Post('mgas/:id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
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
    @UploadedFile() file: any,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.service.addMgaDocument(id, file.originalname, file.filename, user.id);
  }

  @Get('mgas/documents/download/:filename')
  @ApiOperation({ summary: 'Download MGA document' })
  downloadMgaDocument(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
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
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      // ignore unlink error, clear db anyway
    }

    return this.service.deleteMgaDocument(docId);
  }

  // ==========================================
  // REINSURER COMPANY ENDPOINTS
  // ==========================================
  @Get('reinsurers')
  @ApiOperation({ summary: 'Get all reinsurers' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllReinsurers(
    @Query('search') search?: string,
    @Query('is_active') isActive?: boolean,
  ) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllReinsurers(search, active);
  }

  @Post('reinsurers')
  @ApiOperation({ summary: 'Create reinsurer' })
  createReinsurer(@Body() dto: CreateReinsurerDto, @CurrentUser() user: User) {
    return this.service.createReinsurer(dto, user.id);
  }

  @Patch('reinsurers/:id')
  @ApiOperation({ summary: 'Update reinsurer' })
  updateReinsurer(
    @Param('id') id: string,
    @Body() dto: UpdateReinsurerDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateReinsurer(id, dto, user.id);
  }

  @Delete('reinsurers/:id')
  @ApiOperation({ summary: 'Delete reinsurer' })
  deleteReinsurer(@Param('id') id: string) {
    return this.service.deleteReinsurer(id);
  }

  // ==========================================
  // RISK COMPANY ENDPOINTS
  // ==========================================
  @Get('risk-companies')
  @ApiOperation({ summary: 'Get all risk companies' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllRiskCompanies(
    @Query('search') search?: string,
    @Query('is_active') isActive?: boolean,
  ) {
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
        filename: (req, file, cb) => {
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
    @UploadedFile() file: any,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.service.addRiskCompanyDocument(id, file.originalname, file.filename, user.id);
  }

  @Get('risk-companies/documents/download/:filename')
  @ApiOperation({ summary: 'Download Risk Company document' })
  downloadRiskCompanyDocument(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
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
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      // ignore
    }

    return this.service.deleteRiskCompanyDocument(docId);
  }

  // ==========================================
  // LOB ENDPOINTS
  // ==========================================
  @Get('lobs')
  @ApiOperation({ summary: 'Get all LOBs' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllLobs(
    @Query('search') search?: string,
    @Query('is_active') isActive?: boolean,
  ) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllLobs(search, active);
  }

  @Post('lobs')
  @ApiOperation({ summary: 'Create LOB' })
  createLob(@Body() dto: CreateLobDto, @CurrentUser() user: User) {
    return this.service.createLob(dto, user.id);
  }

  @Patch('lobs/:id')
  @ApiOperation({ summary: 'Update LOB' })
  updateLob(
    @Param('id') id: string,
    @Body() dto: UpdateLobDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateLob(id, dto, user.id);
  }

  @Delete('lobs/:id')
  @ApiOperation({ summary: 'Delete LOB' })
  deleteLob(@Param('id') id: string) {
    return this.service.deleteLob(id);
  }

  // ==========================================
  // COB ENDPOINTS
  // ==========================================
  @Get('cobs')
  @ApiOperation({ summary: 'Get all COBs' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllCobs(
    @Query('search') search?: string,
    @Query('is_active') isActive?: boolean,
  ) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllCobs(search, active);
  }

  @Post('cobs')
  @ApiOperation({ summary: 'Create COB' })
  createCob(@Body() dto: CreateCobDto, @CurrentUser() user: User) {
    return this.service.createCob(dto, user.id);
  }

  @Patch('cobs/:id')
  @ApiOperation({ summary: 'Update COB' })
  updateCob(
    @Param('id') id: string,
    @Body() dto: UpdateCobDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateCob(id, dto, user.id);
  }

  @Delete('cobs/:id')
  @ApiOperation({ summary: 'Delete COB' })
  deleteCob(@Param('id') id: string) {
    return this.service.deleteCob(id);
  }

  // ==========================================
  // TREATY MASTER ENDPOINTS
  // ==========================================
  @Get('treaties')
  @ApiOperation({ summary: 'Get all treaties' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllTreaties(
    @Query('search') search?: string,
    @Query('is_active') isActive?: boolean,
  ) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllTreaties(search, active);
  }

  @Get('treaties/:id')
  @ApiOperation({ summary: 'Get one treaty details' })
  findOneTreaty(@Param('id') id: string) {
    return this.service.findOneTreaty(id);
  }

  @Post('treaties')
  @ApiOperation({ summary: 'Create treaty' })
  createTreaty(@Body() dto: CreateTreatyDto, @CurrentUser() user: User) {
    return this.service.createTreaty(dto, user.id);
  }

  @Patch('treaties/:id')
  @ApiOperation({ summary: 'Update treaty' })
  updateTreaty(
    @Param('id') id: string,
    @Body() dto: UpdateTreatyDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateTreaty(id, dto, user.id);
  }

  @Delete('treaties/:id')
  @ApiOperation({ summary: 'Delete treaty' })
  deleteTreaty(@Param('id') id: string) {
    return this.service.deleteTreaty(id);
  }
}
