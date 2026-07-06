import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry {
  permissions: string[];
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000;

/**
 * In-process TTL cache for a user's effective permission set, keyed by user id.
 *
 * This avoids re-running the role-permission / user-permission join queries
 * (and the "all permissions" query for superadmins) on every authenticated
 * request. AuthGuard is the primary reader; RolesService/UsersService
 * invalidate entries when the underlying grants change.
 *
 * Single-instance limitation: this cache lives in process memory and is not
 * shared across instances. If this service is ever horizontally scaled
 * behind a load balancer, a permission change made via one instance will not
 * invalidate the cache held by other instances until their entries expire
 * (bounded by the TTL below). Revisit with a shared cache (e.g. Redis) if/when
 * this deployment scales out.
 */
@Injectable()
export class PermissionCacheService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(private readonly configService: ConfigService) {
    this.ttlMs = this.configService.get<number>('PERMISSION_CACHE_TTL_MS') ?? DEFAULT_TTL_MS;
  }

  get(userId: string): string[] | undefined {
    const entry = this.cache.get(userId);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return undefined;
    }

    return entry.permissions;
  }

  set(userId: string, permissions: string[]): void {
    this.cache.set(userId, {
      permissions,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}
