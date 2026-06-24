import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ActivityLog } from '../../../entities/activity-log.entity';

export interface ActivityLogFilter {
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
    const { userId, moduleId, action, fromDate, toDate, page = 1, limit = 20 } = filter;

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (moduleId) where.moduleId = moduleId;
    if (action) where.action = action;

    if (fromDate && toDate) {
      where.createdAt = Between(fromDate, toDate);
    } else if (fromDate) {
      where.createdAt = MoreThanOrEqual(fromDate);
    } else if (toDate) {
      where.createdAt = LessThanOrEqual(toDate);
    }

    const options: FindManyOptions<ActivityLog> = {
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    };

    return this.repo.findAndCount(options);
  }
}
