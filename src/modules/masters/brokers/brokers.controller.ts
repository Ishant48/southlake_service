import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BrokersService } from './brokers.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateBrokerDto, UpdateBrokerDto } from '../dto/broker.dto';

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class BrokersController {
  constructor(private readonly service: BrokersService) {}

  @Get('brokers')
  @RequirePermission('broker.view')
  @ApiOperation({ summary: 'Get all brokers' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllBrokers(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllBrokers(search, active);
  }

  @Get('brokers/:id')
  @RequirePermission('broker.view')
  @ApiOperation({ summary: 'Get one broker details' })
  findOneBroker(@Param('id') id: string) {
    return this.service.findOneBroker(id);
  }

  @Post('brokers')
  @RequirePermission('broker.create')
  @ApiOperation({ summary: 'Create broker' })
  createBroker(@Body() dto: CreateBrokerDto, @CurrentUser() user: User) {
    return this.service.createBroker(dto, user.id);
  }

  @Patch('brokers/:id')
  @RequirePermission('broker.edit')
  @ApiOperation({ summary: 'Update broker' })
  updateBroker(@Param('id') id: string, @Body() dto: UpdateBrokerDto, @CurrentUser() user: User) {
    return this.service.updateBroker(id, dto, user.id);
  }

  @Delete('brokers/:id')
  @RequirePermission('broker.delete')
  @ApiOperation({ summary: 'Delete broker' })
  deleteBroker(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.deleteBroker(id, user.id);
  }
}
