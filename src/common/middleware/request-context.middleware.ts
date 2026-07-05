import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../context/request-context';

/**
 * Opens the AsyncLocalStorage context for every request before it reaches
 * guards/controllers. AuthGuard fills in the resolved user once it
 * authenticates the request (see AuthGuard.canActivate) — this middleware
 * only seeds the request-scoped fields available before authentication
 * (IP, user agent).
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket?.remoteAddress ??
      'unknown';

    this.requestContext.run(
      {
        ipAddress,
        userAgent: req.headers['user-agent'] ?? undefined,
      },
      next,
    );
  }
}
