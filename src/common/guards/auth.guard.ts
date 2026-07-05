import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { UserSession } from '../../modules/auth/entities/user-session.entity';
import { User } from '../../modules/users/entities/user.entity';
import { RolePermission } from '../../modules/roles/entities/role-permission.entity';
import { UserPermission } from '../../modules/users/entities/user-permission.entity';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContextService } from '../context/request-context';

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
    @InjectRepository(RolePermission)
    private readonly rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private readonly userPermRepo: Repository<UserPermission>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
    private readonly requestContext: RequestContextService,
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
      where: { sessionToken: token, isActive: true },
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

    let permissionSet = new Set<string>();

    if (user.role?.name === 'superadmin') {
      const allPerms = await this.permRepo.find();
      permissionSet = new Set(allPerms.map(p => p.action));
    } else {
      if (user.roleId) {
        const rolePerms = await this.rolePermRepo.find({
          where: { roleId: user.roleId },
          relations: ['permission'],
        });
        for (const rp of rolePerms) {
          if (rp.permission?.action) {
            permissionSet.add(rp.permission.action);
          }
        }
      }

      const userPerms = await this.userPermRepo.find({
        where: { userId: user.id },
        relations: ['permission'],
      });
      for (const up of userPerms) {
        if (up.permission?.action) {
          if (up.accessType === 'grant') {
            permissionSet.add(up.permission.action);
          } else if (up.accessType === 'revoke') {
            permissionSet.delete(up.permission.action);
          }
        }
      }
    }

    const authenticatedUser: AuthenticatedUser = Object.assign(user, {
      effectivePermissions: Array.from(permissionSet),
    });

    request.user = authenticatedUser;
    request.session = session;
    this.requestContext.setUser(user.id, user.name);
    return true;
  }
}
