import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LobsService } from './lobs.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateLobDto, UpdateLobDto } from '../dto/lob.dto';

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class LobsController {
  constructor(private readonly service: LobsService) {}

  @Get('lobs')
  @RequirePermission('lob.view')
  @ApiOperation({ summary: 'Get all LOBs' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllLobs(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllLobs(search, active);
  }

  @Post('lobs')
  @RequirePermission('lob.create')
  @ApiOperation({ summary: 'Create LOB' })
  createLob(@Body() dto: CreateLobDto, @CurrentUser() user: User) {
    return this.service.createLob(dto, user.id);
  }

  @Patch('lobs/:id')
  @RequirePermission('lob.edit')
  @ApiOperation({ summary: 'Update LOB' })
  updateLob(@Param('id') id: string, @Body() dto: UpdateLobDto, @CurrentUser() user: User) {
    return this.service.updateLob(id, dto, user.id);
  }

  @Delete('lobs/:id')
  @RequirePermission('lob.delete')
  @ApiOperation({ summary: 'Delete LOB' })
  deleteLob(@Param('id') id: string) {
    return this.service.deleteLob(id);
  }
}
