import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ApiEndpointsService } from '../api-endpoints/api-endpoints.service';
import { ApiEndpoint } from '../api-endpoints/entities/api-endpoint.entity';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly apiEndpointsService: ApiEndpointsService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user);
    const permissions = await this.buildPermissions(user);

    this.logger.log(`User logged in: ${user.email}`);
    return { token, user: this.sanitizeUser(user), permissions };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    const permissions = await this.buildPermissions(user);
    return { user: this.sanitizeUser(user), permissions };
  }

  private async generateToken(user: { id: number; email: string; username: string; isSuperAdmin: boolean }) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      isSuperAdmin: user.isSuperAdmin,
    };
    return this.jwtService.signAsync(payload);
  }

  private async buildPermissions(user: {
    isSuperAdmin: boolean;
    role?: { roleEndpoints?: { endpointId: number }[]; roleModules?: { moduleId: number }[] } | null;
    userEndpoints?: { endpointId: number }[];
    userModules?: { moduleId: number }[];
  }) {
    if (user.isSuperAdmin) {
      const allEndpoints = await this.apiEndpointsService.findAll();
      return this.groupByModule(allEndpoints);
    }

    const allowedEndpointIds = new Set<number>();

    if (user.role) {
      for (const rm of user.role.roleModules || []) {
        const moduleEndpoints = await this.apiEndpointsService.findByModuleId(rm.moduleId);
        moduleEndpoints.forEach((e) => allowedEndpointIds.add(e.id));
      }
      for (const re of user.role.roleEndpoints || []) {
        allowedEndpointIds.add(re.endpointId);
      }
    }

    for (const um of user.userModules || []) {
      const moduleEndpoints = await this.apiEndpointsService.findByModuleId(um.moduleId);
      moduleEndpoints.forEach((e) => allowedEndpointIds.add(e.id));
    }
    for (const ue of user.userEndpoints || []) {
      allowedEndpointIds.add(ue.endpointId);
    }

    const allEndpoints = await this.apiEndpointsService.findAll();
    const filtered = allEndpoints.filter((e) => allowedEndpointIds.has(e.id));
    return this.groupByModule(filtered);
  }

  private groupByModule(endpoints: ApiEndpoint[]) {
    const map = new Map<number, { moduleId: number; moduleName: string; endpoints: { id: number; method: string; path: string; name: string }[] }>();
    for (const ep of endpoints) {
      const modId = ep.module?.id ?? ep.moduleId;
      const modName = ep.module?.name ?? 'Unknown';
      if (!map.has(modId)) {
        map.set(modId, { moduleId: modId, moduleName: modName, endpoints: [] });
      }
      map.get(modId)!.endpoints.push({
        id: ep.id,
        method: ep.method,
        path: ep.path,
        name: ep.name,
      });
    }
    return Array.from(map.values());
  }

  private sanitizeUser(user: { id: number; username: string; email: string; isActive: boolean; isSuperAdmin: boolean; roleId: number | null; role?: unknown; createdAt: Date; updatedAt: Date }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      isSuperAdmin: user.isSuperAdmin,
      roleId: user.roleId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
