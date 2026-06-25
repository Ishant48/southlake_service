import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsDao } from './dao/activity-logs.dao';
import { ActivityLog } from '../../entities/activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog]),
  ],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService, ActivityLogsDao],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
