import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../modules/activity-logs/entities/activity-log.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const method = request.method;

    const auditMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
    if (!auditMethods.includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          const user = request.user;
          if (!user) return;

          const action = this.mapMethodToAction(method);
          const ipAddress =
            (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            request.socket?.remoteAddress ||
            'unknown';

          const log = this.activityLogRepo.create({
            userId: user.id,
            action,
            description: `${method} ${request.url}`,
            ipAddress,
            userAgent: request.headers['user-agent'] || null,
          });

          await this.activityLogRepo.save(log);
        } catch {
          // Audit log failures must not affect the response
        }
      }),
    );
  }

  private mapMethodToAction(method: string): string {
    switch (method) {
      case 'POST':
        return 'create';
      case 'PATCH':
      case 'PUT':
        return 'edit';
      case 'DELETE':
        return 'delete';
      default:
        return 'view';
    }
  }
}
