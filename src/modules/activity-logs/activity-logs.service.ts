import { Injectable } from '@nestjs/common';
import { ActivityLogsDao, ActivityLogFilter } from './dao/activity-logs.dao';
import { ActivityLog } from '../../entities/activity-log.entity';

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

  async findAll(filter: ActivityLogFilter): Promise<{ data: ActivityLog[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.dao.findAll(filter);
    return {
      data,
      total,
      page: filter.page || 1,
      limit: filter.limit || 20,
    };
  }
}
