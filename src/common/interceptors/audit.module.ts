import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit.interceptor';
import { AuditSubscriber } from '../subscribers/audit.subscriber';
import { RequestContextService } from '../context/request-context';
import { RequestContextMiddleware } from '../middleware/request-context.middleware';
import { ActivityLog } from '../../modules/activity-logs/entities/activity-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])],
  providers: [
    RequestContextService,
    RequestContextMiddleware,
    AuditSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [RequestContextService, RequestContextMiddleware],
})
export class AuditModule {}
