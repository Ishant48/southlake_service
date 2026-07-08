import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ActivityLogsService } from './activity-logs.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('activity-logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly service: ActivityLogsService) {}

  @Get('export')
  @RequirePermission('activity_log.export')
  @ApiOperation({ summary: 'Export activity logs as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async export(
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('module_id') moduleId?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const csv = await this.service.exportCsv({
      search,
      action,
      moduleId,
      fromDate: dateFrom ? new Date(dateFrom) : undefined,
      toDate: dateTo ? new Date(dateTo) : undefined,
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"');
    res.send(csv);
  }

  @Get()
  @RequirePermission('activity_log.view')
  @ApiOperation({ summary: 'List activity logs with optional filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'module_id', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'date_from', required: false })
  @ApiQuery({ name: 'date_to', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated activity logs' })
  findAll(
    @Query('search') search?: string,
    @Query('module_id') moduleId?: string,
    @Query('action') action?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('page') page = '1',
    @Query('per_page') perPage = '20',
  ) {
    return this.service.findAll({
      search,
      moduleId,
      action,
      fromDate: dateFrom ? new Date(dateFrom) : undefined,
      toDate: dateTo ? new Date(dateTo) : undefined,
      page: parseInt(page, 10),
      limit: parseInt(perPage, 10),
    });
  }

  @Get('stats')
  @RequirePermission('activity_log.view')
  @ApiOperation({ summary: 'Get summary statistics of activity logs' })
  @ApiResponse({ status: 200, description: 'Summary statistics' })
  getStats() {
    return this.service.getStats();
  }
}
