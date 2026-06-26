import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../../entities/user-session.entity';
import { User } from '../../entities/user.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { UserPermission } from '../../entities/user-permission.entity';
import { Permission } from '../../entities/permission.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

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
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    (user as any).effectivePermissions = Array.from(permissionSet);

    request.user = user;
    request.session = session;
    return true;
  }
}
