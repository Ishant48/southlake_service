import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsDao } from './dao/activity-logs.dao';
import { ActivityLog } from './entities/activity-log.entity';
import { AuditModule } from '../../common/interceptors/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog]),
    AuditModule,
  ],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService, ActivityLogsDao],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
