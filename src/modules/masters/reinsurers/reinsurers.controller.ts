import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReinsurersService } from './reinsurers.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateReinsurerDto, UpdateReinsurerDto } from '../dto/reinsurer.dto';

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class ReinsurersController {
  constructor(private readonly service: ReinsurersService) {}

  @Get('reinsurers')
  @RequirePermission('reinsurer.view')
  @ApiOperation({ summary: 'Get all reinsurers' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllReinsurers(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllReinsurers(search, active);
  }

  @Post('reinsurers')
  @RequirePermission('reinsurer.create')
  @ApiOperation({ summary: 'Create reinsurer' })
  createReinsurer(@Body() dto: CreateReinsurerDto, @CurrentUser() user: User) {
    return this.service.createReinsurer(dto, user.id);
  }

  @Patch('reinsurers/:id')
  @RequirePermission('reinsurer.edit')
  @ApiOperation({ summary: 'Update reinsurer' })
  updateReinsurer(
    @Param('id') id: string,
    @Body() dto: UpdateReinsurerDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateReinsurer(id, dto, user.id);
  }

  @Delete('reinsurers/:id')
  @RequirePermission('reinsurer.delete')
  @ApiOperation({ summary: 'Delete reinsurer' })
  deleteReinsurer(@Param('id') id: string) {
    return this.service.deleteReinsurer(id);
  }
}
