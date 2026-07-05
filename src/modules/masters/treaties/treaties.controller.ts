import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TreatiesService } from './treaties.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateTreatyDto, UpdateTreatyDto } from '../dto/treaty.dto';

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class TreatiesController {
  constructor(private readonly service: TreatiesService) {}

  @Get('treaties')
  @ApiOperation({ summary: 'Get all treaties' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllTreaties(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
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
  updateTreaty(@Param('id') id: string, @Body() dto: UpdateTreatyDto, @CurrentUser() user: User) {
    return this.service.updateTreaty(id, dto, user.id);
  }

  @Delete('treaties/:id')
  @ApiOperation({ summary: 'Delete treaty' })
  deleteTreaty(@Param('id') id: string) {
    return this.service.deleteTreaty(id);
  }
}
