import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TreatyTypesService } from './treaty-types.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateTreatyTypeDto, UpdateTreatyTypeDto } from '../dto/treaty-type.dto';

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class TreatyTypesController {
  constructor(private readonly service: TreatyTypesService) {}

  @Get('treaty-types')
  @ApiOperation({ summary: 'Get all Treaty Types' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllTreatyTypes(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllTreatyTypes(search, active);
  }

  @Post('treaty-types')
  @ApiOperation({ summary: 'Create Treaty Type' })
  createTreatyType(@Body() dto: CreateTreatyTypeDto, @CurrentUser() user: User) {
    return this.service.createTreatyType(dto, user.id);
  }

  @Patch('treaty-types/:id')
  @ApiOperation({ summary: 'Update Treaty Type' })
  updateTreatyType(@Param('id') id: string, @Body() dto: UpdateTreatyTypeDto, @CurrentUser() user: User) {
    return this.service.updateTreatyType(id, dto, user.id);
  }

  @Delete('treaty-types/:id')
  @ApiOperation({ summary: 'Delete Treaty Type' })
  deleteTreatyType(@Param('id') id: string) {
    return this.service.deleteTreatyType(id);
  }
}
