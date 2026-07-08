import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { UserSession } from '../../modules/auth/entities/user-session.entity';
import { User } from '../../modules/users/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContextService } from '../context/request-context';
import { hashToken } from '../utils/hash-token.util';
import { PermissionCacheService } from '../cache/permission-cache.service';
import { PermissionResolutionService } from '../../modules/permissions/permission-resolution.service';

/** User attached to the request once AuthGuard resolves it, with the effective permission set computed for this request. */
export type AuthenticatedUser = User & { effectivePermissions: string[] };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly requestContext: RequestContextService,
    private readonly permissionCache: PermissionCacheService,
    private readonly permissionResolution: PermissionResolutionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser; session?: UserSession }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);

    const session = await this.sessionRepo.findOne({
      where: { sessionToken: hashToken(token), isActive: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session has expired');
    }

    const user = await this.userRepo.findOne({
      where: { id: session.userId, isDeleted: false },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is inactive');
    }

    if (user.role?.isActive === false && !user.isSuperAdmin) {
      throw new UnauthorizedException('Your role has been deactivated');
    }

    const cachedPermissions = this.permissionCache.get(user.id);
    let effectivePermissions: string[];

    if (cachedPermissions) {
      effectivePermissions = cachedPermissions;
    } else {
      const resolved = await this.permissionResolution.resolveEffectivePermissions(user);
      effectivePermissions = resolved.map(p => p.action);
      this.permissionCache.set(user.id, effectivePermissions);
    }

    const authenticatedUser: AuthenticatedUser = Object.assign(user, {
      effectivePermissions,
    });

    request.user = authenticatedUser;
    request.session = session;
    this.requestContext.setUser(user.id, user.name);
    this.requestContext.setSessionId(session.id);
    return true;
  }
}
