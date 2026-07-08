import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindManyOptions,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  ILike,
} from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';

export interface ActivityLogFilter {
  search?: string;
  userId?: string;
  moduleId?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class ActivityLogsDao {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) {}

  save(log: Partial<ActivityLog>): Promise<ActivityLog> {
    return this.repo.save(this.repo.create(log));
  }

  async findAll(filter: ActivityLogFilter): Promise<[ActivityLog[], number]> {
    const { search, userId, moduleId, action, fromDate, toDate, page = 1, limit = 20 } = filter;

    const base: Record<string, unknown> = {};

    if (userId) base.userId = userId;
    if (moduleId) base.moduleId = moduleId;
    if (action) base.action = action;

    if (fromDate && toDate) {
      base.createdAt = Between(fromDate, toDate);
    } else if (fromDate) {
      base.createdAt = MoreThanOrEqual(fromDate);
    } else if (toDate) {
      base.createdAt = LessThanOrEqual(toDate);
    }

    const options: FindManyOptions<ActivityLog> = {
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    };

    if (search) {
      options.where = [
        { ...base, description: ILike(`%${search}%`) },
        { ...base, action: ILike(`%${search}%`) },
      ];
    } else if (Object.keys(base).length > 0) {
      options.where = base;
    }

    return this.repo.findAndCount(options);
  }

  async findAllForExport(
    filter: Omit<ActivityLogFilter, 'page' | 'limit'>,
  ): Promise<ActivityLog[]> {
    const { search, userId, moduleId, action, fromDate, toDate } = filter;

    const base: Record<string, unknown> = {};

    if (userId) base.userId = userId;
    if (moduleId) base.moduleId = moduleId;
    if (action) base.action = action;

    if (fromDate && toDate) {
      base.createdAt = Between(fromDate, toDate);
    } else if (fromDate) {
      base.createdAt = MoreThanOrEqual(fromDate);
    } else if (toDate) {
      base.createdAt = LessThanOrEqual(toDate);
    }

    const findOpts: FindManyOptions<ActivityLog> = {
      order: { createdAt: 'DESC' },
      relations: ['user'],
      take: 10000,
    };

    if (search) {
      findOpts.where = [
        { ...base, description: ILike(`%${search}%`) },
        { ...base, action: ILike(`%${search}%`) },
      ];
    } else if (Object.keys(base).length > 0) {
      findOpts.where = base;
    }

    return this.repo.find(findOpts);
  }

  async getStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    critical: number;
    activeUsers: number;
  }> {
    const manager = this.repo.manager;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total, successful, failed, critical, activeUsersResult] = await Promise.all([
      this.repo.count(),
      this.repo.countBy({ status: 'Success' }),
      this.repo.countBy({ status: 'Failed' }),
      this.repo.countBy({ status: 'Critical' }),
      manager.createQueryBuilder()
        .select('COUNT(DISTINCT(user_id))', 'count')
        .from('activity_logs', 'al')
        .where('al.created_at >= :today', { today: startOfToday })
        .getRawOne(),
    ]);

    return {
      total,
      successful,
      failed: failed || 0,
      critical: critical || 0,
      activeUsers: parseInt(activeUsersResult?.count || '0', 10),
    };
  }
}
