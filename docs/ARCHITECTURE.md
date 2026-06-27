# Architecture Overview

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS v11 |
| Database | PostgreSQL (TypeORM v0.3, no `synchronize`) |
| Auth | Session token (Bearer) + OTP via email |
| Async tasks | BullMQ + Redis |
| Rate limiting | @nestjs/throttler |
| Validation | class-validator + class-transformer |

---

## Project Structure

```
southlake_service/
├── src/
│   ├── app.module.ts              # Root module: TypeORM, Config, Rate Limit, Guards
│   ├── main.ts                    # Bootstrap: CORS, Helmet, global prefix /api
│   │
│   ├── common/                    # Shared utilities
│   │   ├── entities/              # Abstract base classes (BaseEntity, AuditableEntity, SoftDeleteEntity)
│   │   ├── filters/               # HttpExceptionFilter
│   │   ├── guards/                # AuthGuard (session token), RolesGuard
│   │   ├── interceptors/          # AuditInterceptor, SnakeCaseInterceptor
│   │   ├── queues/mail/           # MailProducer, MailProcessor, MAIL_QUEUE types
│   │   ├── communication/         # CommunicationService (wraps MailProducer)
│   │   └── rate-limit/            # RateLimitModule (ThrottlerModule config)
│   │
│   ├── config/                    # Config namespaces
│   │   ├── app.config.ts          # PORT, OTP_EXPIRY_MINUTES, SESSION_EXPIRY_HOURS, …
│   │   ├── database.config.ts     # DATABASE_* vars
│   │   ├── mail.config.ts         # MAIL_HOST, MAIL_PORT, MAIL_FROM, …
│   │   └── redis.config.ts        # REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
│   │
│   ├── common/config/
│   │   └── env.validation.ts      # EnvVars class + validate() for ConfigModule
│   │
│   ├── database/
│   │   ├── data-source.ts         # TypeORM CLI DataSource (glob: modules/**/*.entity.*)
│   │   └── migrations/            # SQL migration files
│   │
│   └── modules/
│       ├── auth/
│       │   ├── entities/          # login-otp, user-session, login-challenge
│       │   ├── dao/auth.dao.ts    # DB operations for auth
│       │   ├── auth.service.ts
│       │   ├── auth.controller.ts
│       │   └── auth.module.ts
│       │
│       ├── users/
│       │   ├── entities/          # user, user-permission, pending-invite
│       │   ├── dao/users.dao.ts
│       │   ├── users.service.ts
│       │   ├── users.controller.ts
│       │   ├── invites.controller.ts
│       │   └── users.module.ts
│       │
│       ├── roles/
│       │   ├── entities/          # role, role-permission
│       │   ├── dao/roles.dao.ts
│       │   ├── roles.service.ts
│       │   ├── roles.controller.ts
│       │   └── roles.module.ts
│       │
│       ├── permissions/
│       │   ├── entities/          # module, submodule, permission
│       │   ├── dao/permissions.dao.ts
│       │   ├── permissions.service.ts
│       │   └── permissions.module.ts
│       │
│       ├── activity-logs/
│       │   ├── entities/          # activity-log
│       │   ├── dao/activity-logs.dao.ts
│       │   ├── activity-logs.service.ts
│       │   └── activity-logs.module.ts
│       │
│       └── mail/
│           ├── mail.service.ts    # Nodemailer OTP + invite emails
│           └── mail.module.ts
│
├── test/
│   ├── helpers/
│   │   ├── db.helper.ts           # DbHelper: seed & cleanup for e2e tests
│   │   └── auth.helper.ts         # AuthHelper: full OTP login flow helper
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   ├── users.e2e-spec.ts
│   ├── roles.e2e-spec.ts
│   └── jest-e2e.json
│
└── docs/                          # This folder
```

---

## Module Dependency Graph

```
AppModule
 ├── ConfigModule (global, with env validation)
 ├── TypeOrmModule (entities from modules/**/entities/)
 ├── RateLimitModule → ThrottlerModule (Redis store)
 ├── AuthModule → UsersModule, MailModule, ActivityLogsModule
 ├── UsersModule → RolesModule, MailModule, ActivityLogsModule
 ├── RolesModule → ActivityLogsModule
 ├── PermissionsModule
 ├── ActivityLogsModule
 └── CommunicationModule → MailQueueModule (BullMQ)
```

---

## Entity Location Rule

Each entity lives inside the owning module's `entities/` subfolder.  
Cross-module entities are imported by path (e.g., `../../users/entities/user.entity`).  
The `src/common/entities/` folder holds **only abstract base classes** (no database tables).

---

## Global Setup (main.ts)

```typescript
app.setGlobalPrefix('api');
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalInterceptors(new SnakeCaseInterceptor(), new AuditInterceptor());
app.use(helmet());
app.enableCors({ origin: process.env.CORS_ORIGIN });
```

---

## Related Documentation

- [Base Entity Pattern](./BASE_ENTITY.md)
- [Auth Module](./AUTH_MODULE.md)
- [Env Configuration](./ENV_SETUP.md)
