# Rate Limiting

## Overview

Rate limiting is implemented globally using `@nestjs/throttler` with two named tiers. The `ThrottlerGuard` is registered as a global `APP_GUARD` so every endpoint is protected by default.

---

## Configuration

**Module:** `src/common/rate-limit/rate-limit.module.ts`

```typescript
ThrottlerModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    throttlers: [
      {
        name: 'default',
        ttl: configService.get<number>('app.rateLimitTtl') ?? 60,   // seconds
        limit: configService.get<number>('app.rateLimitMax') ?? 100, // requests per window
      },
      {
        name: 'short',
        ttl: 5 * 60,   // 5 minute window
        limit: 20,      // max 20 requests per 5 min (strict endpoints)
      },
    ],
  }),
})
```

---

## Environment Variables

| Env var | Default | Description |
|---------|---------|-------------|
| `RATE_LIMIT_TTL` | `60` | Window size in seconds for the default tier |
| `RATE_LIMIT_MAX` | `100` | Max requests per window for the default tier |

These can be overridden per environment. In `.env.test`, `RATE_LIMIT_MAX=1000` prevents tests from hitting limits.

---

## Applying Per-Endpoint Overrides

To use a stricter limit on a specific endpoint, use the `@Throttle` decorator:

```typescript
import { Throttle } from '@nestjs/throttler';

@Throttle({ short: { ttl: 300, limit: 5 } })
@Post('login')
async login() { ... }
```

---

## Skipping Rate Limiting

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Get('health')
health() { ... }
```

---

## Global Guard Registration

In `app.module.ts`:

```typescript
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard,
}
```

This means rate limiting applies before the auth guard — unauthenticated requests are still rate-limited by IP.

---

## Response on Limit Exceeded

```json
HTTP 429 Too Many Requests
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

## Related Documentation

- [Environment Configuration](./ENV_SETUP.md)
- [Architecture Overview](./ARCHITECTURE.md)
