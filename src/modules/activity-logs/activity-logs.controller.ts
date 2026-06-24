import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';

@ApiTags('activity-logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly service: ActivityLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List activity logs with optional filters' })
  @ApiQuery({ name: 'user_id', required: false })
  @ApiQuery({ name: 'module_id', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'from_date', required: false })
  @ApiQuery({ name: 'to_date', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated activity logs' })
  findAll(
    @Query('user_id') userId?: string,
    @Query('module_id') moduleId?: string,
    @Query('action') action?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.findAll({
      userId,
      moduleId,
      action,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }
}
