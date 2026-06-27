# Environment Configuration

## Overview

Environment variables are validated at startup using `class-validator` + `class-transformer`. If any required variable is missing or invalid, the process exits with a descriptive error before the application starts.

**Validation file:** `src/common/config/env.validation.ts`

---

## Required Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Must be `development`, `production`, or `test` |
| `DATABASE_HOST` | PostgreSQL host |
| `DATABASE_NAME` | PostgreSQL database name |
| `DATABASE_USER` | PostgreSQL user |
| `DATABASE_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Secret for signing session tokens |

---

## Optional Variables (with defaults)

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `APP_URL` | — | Public frontend URL (used in invite links) |
| `CORS_ORIGIN` | — | Allowed CORS origin |
| `LOG_LEVEL` | `info` | Logging level |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PORT` | `5432` | PostgreSQL port |

### Auth / OTP

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_EXPIRY_HOURS` | `24` | Session token lifetime |
| `OTP_EXPIRY_MINUTES` | `5` | OTP validity window |
| `OTP_MAX_ATTEMPTS` | `5` | Max failed OTP attempts |

### Mail

| Variable | Default | Description |
|----------|---------|-------------|
| `MAIL_HOST` | `localhost` | SMTP server hostname |
| `MAIL_PORT` | `1025` | SMTP server port |
| `MAIL_USER` | — | SMTP auth username |
| `MAIL_PASSWORD` | — | SMTP auth password |
| `MAIL_FROM` | `noreply@southlake.com` | From address |

### Redis

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | — | Redis auth password |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_TTL` | `60` | Window size in seconds |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

---

## Environment Files

| File | Purpose | Committed |
|------|---------|-----------|
| `.env` | Local development | No (in `.gitignore`) |
| `.env.example` | Template for all variables | Yes |
| `.env.test` | Used by `npm run test:e2e` | No (in `.gitignore`) |

---

## Validation Flow

```typescript
// In ConfigModule.forRoot()
validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.map(e => Object.values(e.constraints).join(', ')).join('\n'));
  }
  return validated;
}
```

---

## Minimum .env for Local Development

```env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_NAME=southlake_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
JWT_SECRET=change-this-secret
```

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Bull Queue](./BULL_QUEUE.md) — Redis config
- [Rate Limiting](./RATE_LIMITING.md)
- [Testing Guide](./TESTING.md) — .env.test usage
