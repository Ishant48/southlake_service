import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MastersConfigService } from './masters-config.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from '../dto/document-type.dto';
import {
  CreateSequencePrefixCounterDto,
  UpdateSequencePrefixCounterDto,
} from '../dto/sequence-prefix-counter.dto';

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class MastersConfigController {
  constructor(private readonly service: MastersConfigService) {}

  // ==========================================
  // LOCKED PERIODS ENDPOINTS
  // ==========================================
  @Get('locked-periods')
  @RequirePermission('masters_config.view')
  @ApiOperation({ summary: 'Get all locked periods' })
  @ApiQuery({ name: 'search', required: false })
  findAllLockedPeriods(@Query('search') search?: string) {
    return this.service.findAllLockedPeriods(search);
  }

  @Post('locked-periods/lock')
  @RequirePermission('masters_config.edit')
  @ApiOperation({ summary: 'Lock a period' })
  lockPeriod(@Body('period') period: string, @CurrentUser() user: User) {
    if (!period) throw new BadRequestException('Period is required');
    return this.service.lockPeriod(period, user.id);
  }

  @Post('locked-periods/unlock')
  @RequirePermission('masters_config.edit')
  @ApiOperation({ summary: 'Unlock a period' })
  unlockPeriod(@Body('period') period: string, @CurrentUser() user: User) {
    if (!period) throw new BadRequestException('Period is required');
    return this.service.unlockPeriod(period, user.id);
  }

  // ==========================================
  // DOCUMENT TYPES ENDPOINTS
  // ==========================================
  @Get('document-types')
  @RequirePermission('masters_config.view')
  @ApiOperation({ summary: 'Get all document types' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAllDocumentTypes(@Query('search') search?: string, @Query('isActive') isActive?: boolean) {
    return this.service.findAllDocumentTypes(search, isActive);
  }

  @Get('document-types/:id')
  @RequirePermission('masters_config.view')
  @ApiOperation({ summary: 'Get document type by id' })
  findOneDocumentType(@Param('id') id: string) {
    return this.service.findOneDocumentType(id);
  }

  @Post('document-types')
  @RequirePermission('masters_config.create')
  @ApiOperation({ summary: 'Create document type' })
  createDocumentType(@Body() dto: CreateDocumentTypeDto, @CurrentUser() user: User) {
    return this.service.createDocumentType(dto, user.id);
  }

  @Patch('document-types/:id')
  @RequirePermission('masters_config.edit')
  @ApiOperation({ summary: 'Update document type' })
  updateDocumentType(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentTypeDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateDocumentType(id, dto, user.id);
  }

  @Delete('document-types/:id')
  @RequirePermission('masters_config.delete')
  @ApiOperation({ summary: 'Delete document type' })
  deleteDocumentType(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.deleteDocumentType(id, user.id);
  }

  // ==========================================
  // SEQUENCE PREFIX & COUNTERS ENDPOINTS
  // ==========================================
  @Get('sequence-prefix-counters')
  @RequirePermission('masters_config.view')
  @ApiOperation({ summary: 'Get all sequence prefix & counters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAllSequencePrefixCounters(
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.service.findAllSequencePrefixCounters(search, isActive);
  }

  @Get('sequence-prefix-counters/:id')
  @RequirePermission('masters_config.view')
  @ApiOperation({ summary: 'Get sequence prefix & counter by id' })
  findOneSequencePrefixCounter(@Param('id') id: string) {
    return this.service.findOneSequencePrefixCounter(id);
  }

  @Post('sequence-prefix-counters')
  @RequirePermission('masters_config.create')
  @ApiOperation({ summary: 'Create sequence prefix & counter' })
  createSequencePrefixCounter(
    @Body() dto: CreateSequencePrefixCounterDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createSequencePrefixCounter(dto, user.id);
  }

  @Patch('sequence-prefix-counters/:id')
  @RequirePermission('masters_config.edit')
  @ApiOperation({ summary: 'Update sequence prefix & counter' })
  updateSequencePrefixCounter(
    @Param('id') id: string,
    @Body() dto: UpdateSequencePrefixCounterDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateSequencePrefixCounter(id, dto, user.id);
  }

  @Delete('sequence-prefix-counters/:id')
  @RequirePermission('masters_config.delete')
  @ApiOperation({ summary: 'Delete sequence prefix & counter' })
  deleteSequencePrefixCounter(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.deleteSequencePrefixCounter(id, user.id);
  }
}
