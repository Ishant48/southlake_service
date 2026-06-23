import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { ApiEndpointsService } from '../../api-endpoints/api-endpoints.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly apiEndpointsService: ApiEndpointsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const jwtUser = request.user;
    if (!jwtUser) return false;

    const user = await this.usersService.findWithPermissions(jwtUser.sub);
    if (!user) return false;

    if (user.isSuperAdmin) return true;
    if (!user.isActive) throw new ForbiddenException('Account is inactive');

    const method = request.method;
    const path = request.route.path;

    const endpoint = await this.apiEndpointsService.findByMethodAndPath(method, path);
    if (!endpoint) return false;

    const allowedIds = new Set<number>();

    if (user.role) {
      for (const rm of user.role.roleModules || []) {
        const moduleEndpoints = await this.apiEndpointsService.findByModuleId(rm.moduleId);
        moduleEndpoints.forEach((e) => allowedIds.add(e.id));
      }
      for (const re of user.role.roleEndpoints || []) {
        allowedIds.add(re.endpointId);
      }
    }

    for (const um of user.userModules || []) {
      const moduleEndpoints = await this.apiEndpointsService.findByModuleId(um.moduleId);
      moduleEndpoints.forEach((e) => allowedIds.add(e.id));
    }
    for (const ue of user.userEndpoints || []) {
      allowedIds.add(ue.endpointId);
    }

    if (!allowedIds.has(endpoint.id)) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
