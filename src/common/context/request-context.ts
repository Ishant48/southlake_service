import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Per-request state (current user, IP, user agent) that needs to be reachable
 * from code that doesn't have the HTTP request in scope — e.g. a TypeORM
 * subscriber running a save() during a controller call, three layers away
 * from the request object. Populated once per request by
 * RequestContextMiddleware, then updated with the resolved user once
 * AuthGuard authenticates the request.
 */
export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestContextStore>();

  run(store: RequestContextStore, callback: () => void): void {
    RequestContextService.storage.run(store, callback);
  }

  private getStore(): RequestContextStore | undefined {
    return RequestContextService.storage.getStore();
  }

  setUser(userId: string, userName?: string): void {
    const store = this.getStore();
    if (store) {
      store.userId = userId;
      store.userName = userName;
    }
  }

  getUserId(): string | undefined {
    return this.getStore()?.userId;
  }

  getUserName(): string | undefined {
    return this.getStore()?.userName;
  }

  getIpAddress(): string | undefined {
    return this.getStore()?.ipAddress;
  }

  getUserAgent(): string | undefined {
    return this.getStore()?.userAgent;
  }
}
