import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CobsService } from './cobs.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateCobDto, UpdateCobDto } from '../dto/cob.dto';

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class CobsController {
  constructor(private readonly service: CobsService) {}

  @Get('cobs')
  @ApiOperation({ summary: 'Get all COBs' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllCobs(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
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
  updateCob(@Param('id') id: string, @Body() dto: UpdateCobDto, @CurrentUser() user: User) {
    return this.service.updateCob(id, dto, user.id);
  }

  @Delete('cobs/:id')
  @ApiOperation({ summary: 'Delete COB' })
  deleteCob(@Param('id') id: string) {
    return this.service.deleteCob(id);
  }
}
