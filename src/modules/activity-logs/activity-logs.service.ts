import { Injectable } from '@nestjs/common';
import { ActivityLogsDao, ActivityLogFilter } from './dao/activity-logs.dao';
import { ActivityLog } from './entities/activity-log.entity';

export interface LogEntry {
  userId?: string;
  moduleId?: string;
  submoduleId?: string;
  action: string;
  description?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changes?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(private readonly dao: ActivityLogsDao) {}

  async log(entry: LogEntry): Promise<ActivityLog> {
    return this.dao.save({
      userId: entry.userId ?? undefined,
      moduleId: entry.moduleId ?? undefined,
      submoduleId: entry.submoduleId ?? undefined,
      action: entry.action,
      description: entry.description ?? undefined,
      oldValues: entry.oldValues ?? null,
      newValues: entry.newValues ?? null,
      changes: entry.changes ?? null,
      ipAddress: entry.ipAddress ?? undefined,
      userAgent: entry.userAgent ?? undefined,
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
    const perPage = filter.limit ?? 20;
    const page = filter.page ?? 1;
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
      log.user?.name ?? '',
      log.user?.email ?? '',
      log.action,
      log.moduleId ?? '',
      (log.description ?? '').replace(/,/g, ';'),
      log.ipAddress ?? '',
    ]);

    const csvLines = [headers, ...rows].map(row => row.join(','));
    return csvLines.join('\n');
  }
}
