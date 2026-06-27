import { Injectable } from '@nestjs/common';
import { ActivityLogsDao, ActivityLogFilter } from './dao/activity-logs.dao';
import { ActivityLog } from './entities/activity-log.entity';

export interface LogEntry {
  userId?: string;
  moduleId?: string;
  submoduleId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(private readonly dao: ActivityLogsDao) {}

  async log(entry: LogEntry): Promise<ActivityLog> {
    return this.dao.save({
      userId: entry.userId || null,
      moduleId: entry.moduleId || null,
      submoduleId: entry.submoduleId || null,
      action: entry.action,
      entityType: entry.entityType || null,
      entityId: entry.entityId || null,
      description: entry.description || null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
    });
  }

  async findAll(filter: ActivityLogFilter): Promise<{
    data: ActivityLog[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const [data, total] = await this.dao.findAll(filter);
    const perPage = filter.limit || 20;
    const page = filter.page || 1;
    return {
      data,
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    };
  }

  async exportCsv(filter: Omit<ActivityLogFilter, 'page' | 'limit'>): Promise<string> {
    const logs = await this.dao.findAllForExport(filter);

    const headers = ['Date', 'User', 'Email', 'Action', 'Module', 'Description', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.user?.name || '',
      log.user?.email || '',
      log.action,
      log.moduleId || '',
      (log.description || '').replace(/,/g, ';'),
      log.ipAddress || '',
    ]);

    const csvLines = [headers, ...rows].map(row => row.join(','));
    return csvLines.join('\n');
  }
}
