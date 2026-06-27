# southlake-service

NestJS backend for the **Southlake Insurance** platform.
Covers the **User Management / IAM** domain: identity, sessions, roles, permissions, audit trail, and email-OTP authentication.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js ≥ 24 |
| Framework | NestJS 11 |
| ORM | TypeORM 0.3 (no `synchronize`, migrations only) |
| Database | PostgreSQL 15+ |
| Auth | Email OTP + opaque session tokens (Bearer header) |
| Queue | BullMQ (8 priority queues P0–P7 via Redis) |
| Email | Nodemailer (SMTP) |
| Docs | Swagger / OpenAPI |
| Validation | class-validator + class-transformer |
| Rate limiting | @nestjs/throttler (global guard) |
| Security | helmet, CORS, input whitelist |
| Linting | ESLint 9 flat config + Prettier 3 + Husky v9 |

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 24 |
| PostgreSQL | ≥ 15 |
| Redis | ≥ 7 (required for BullMQ priority queues) |
| SMTP account | Gmail, SendGrid, Mailgun, etc. |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in values
cp .env.example .env.development

# 3. Run migrations (creates schema) + seed base data
npm run db:migrate
npm run db:seed

# 4. Start in development mode (hot-reload — loads .env.development automatically)
npm run start:dev
```

Once running, three URLs are logged to the console:

```
Service    → http://localhost:3000/api
Swagger    → http://localhost:3000/api/docs
Bull Board → http://localhost:3000/admin/queues  (user: admin)
```

> **Note:** Swagger is automatically disabled when `NODE_ENV=production`.
> Bull Board is protected by HTTP Basic Auth (`BULL_BOARD_USERNAME` / `BULL_BOARD_PASSWORD`).

---

## All Commands

### Development

```bash
npm run start           # Start (loads .env.development)
npm run start:dev       # Start with hot-reload (loads .env.development)
npm run start:debug     # Start with debugger + watch
npm run start:prod      # Run compiled dist/ (loads .env.production)
```

### Build

```bash
npm run build           # Compile TypeScript to dist/
npm run type-check      # Type-check without emitting files
```

### Code Quality

```bash
npm run lint            # Check for ESLint errors (max-warnings 0)
npm run lint:fix        # Auto-fix ESLint errors
npm run format          # Format all src/ + test/ files with Prettier
npm run format:check    # Check formatting without writing
```

### Database — Dev (`southlake_db`)

```bash
npm run db:migrate          # Run all pending migrations (schema only)
npm run db:migrate:revert   # Revert the last migration
npm run db:generate         # Generate migration file from entity diff
npm run db:create           # Create a blank migration file
npm run db:seed             # Seed base data (roles, modules, permissions, superadmin user)
npm run db:reset            # Force-drop → recreate → run all migrations
npm run db:refresh          # db:reset + db:seed  (full clean slate)
```

> `synchronize` is always `false`. All schema changes must go through migrations.  
> Seeds (002, 003) are embedded in migrations, so `db:migrate` seeds too. Use `db:seed` to re-seed without resetting.

### Database — Test (`southlake_test_db`)

```bash
npm run test:db:migrate         # Run migrations on test DB
npm run test:db:migrate:revert  # Revert last migration on test DB
npm run test:db:seed            # Seed test DB
npm run test:db:reset           # Force-drop → recreate → run all migrations on test DB
npm run test:db:refresh         # test:db:reset + test:db:seed
```

### Testing

```bash
# Unit tests (loads .env.development)
npm test                    # Run all unit tests once
npm run test:watch          # Unit tests in watch mode
npm run test:cov            # Unit tests with coverage report

# End-to-end tests (loads .env.test)
npm run test:e2e            # Run e2e tests against test DB
npm run test:e2e:watch      # E2E tests in watch mode
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure each value.

### Application

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` | — |
| `PORT` | HTTP server port | `3000` |
| `APP_URL` | Frontend base URL (used in invite links) | `http://localhost:4200` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:4200` |

### Database

| Variable | Description | Default |
|---|---|---|
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_NAME` | Database name | `southlake_db` |
| `DATABASE_USER` | PostgreSQL username | `postgres` |
| `DATABASE_PASSWORD` | PostgreSQL password | `postgres` |

### Auth

| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET` | Secret for session token generation | — |
| `SESSION_EXPIRY_HOURS` | Session lifetime | `24` |
| `OTP_EXPIRY_MINUTES` | OTP time-to-live | `5` |
| `OTP_MAX_ATTEMPTS` | Max failed OTP attempts | `5` |

### Mail (SMTP)

| Variable | Description | Default |
|---|---|---|
| `MAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP username / email | — |
| `MAIL_PASSWORD` | SMTP password / app password | — |
| `MAIL_FROM` | From address shown on emails | `Southlake Insurance <noreply@southlake.com>` |

### Redis (BullMQ)

| Variable | Description | Default |
|---|---|---|
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (optional) | — |

### Rate Limiting

| Variable | Description | Default |
|---|---|---|
| `RATE_LIMIT_TTL` | Time window in ms | `60000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

### Bull Board Dashboard

| Variable | Description | Default |
|---|---|---|
| `BULL_BOARD_PATH` | Dashboard mount path | `/admin/queues` |
| `BULL_BOARD_USERNAME` | Basic auth username | `admin` |
| `BULL_BOARD_PASSWORD` | Basic auth password | `admin` |

---

## Project Structure

```
src/
├── main.ts                         Bootstrap — security, pipes, Swagger, Bull Board, 3 URL logs
├── app.module.ts                   Root module (BullModule.forRootAsync, TypeORM, guards)
│
├── config/                         registerAs() config factories
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── mail.config.ts
│   ├── redis.config.ts
│   └── index.ts
│
├── common/
│   ├── entities/                   Abstract base classes (NOT real DB tables)
│   │   ├── base.entity.ts          id, createdAt, updatedAt, createdBy, updatedBy
│   │   ├── auditable.entity.ts     extends BaseEntity
│   │   ├── soft-delete.entity.ts   extends AuditableEntity + isDeleted, deletedAt
│   │   └── index.ts
│   │
│   ├── queues/
│   │   ├── mail/                   Legacy single-queue mail (MailProducer, MailProcessor)
│   │   │   └── index.ts
│   │   ├── priority/               8-priority queue system (P0–P7)
│   │   │   ├── queue-priority.enum.ts   P0 (critical/OTP) → P7 (batch)
│   │   │   ├── priority-queue.types.ts
│   │   │   ├── base-priority.processor.ts
│   │   │   ├── priority-queue.processors.ts  8 @Processor classes with concurrency
│   │   │   ├── priority-queue.producer.ts    enqueueOtp() → P0, enqueueInvite() → P3
│   │   │   ├── priority-queue.module.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── communication/              CommunicationService — wraps PriorityQueueProducer
│   │   └── index.ts
│   │
│   ├── rate-limit/                 ThrottlerModule (default + short tiers)
│   │   └── index.ts
│   │
│   ├── decorators/                 @CurrentUser(), @Public(), @Roles()
│   ├── filters/                    HttpExceptionFilter
│   ├── guards/                     AuthGuard, RolesGuard, AuthGuardModule
│   ├── interceptors/               AuditInterceptor, SnakeCaseInterceptor, AuditModule
│   ├── pipes/                      UuidValidationPipe
│   ├── config/                     EnvVars validation (plainToInstance + validateSync)
│   └── index.ts
│
├── database/
│   ├── data-source.ts              TypeORM DataSource for CLI (glob: modules/**/*.entity.*)
│   └── migrations/
│       ├── 001-initial-schema.ts
│       ├── 002-seed-roles-modules.ts
│       ├── 003-seed-superadmin-user.ts
│       ├── 004-add-password-hash.ts
│       └── 005-pending-invite-extra-fields.ts
│
└── modules/
    ├── auth/
    │   ├── entities/               login-otp, user-session, login-challenge
    │   ├── dto/                    login, request-otp, verify-otp, resolve-challenge
    │   ├── dao/auth.dao.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   ├── auth.module.ts
    │   └── index.ts
    │
    ├── users/
    │   ├── entities/               user, user-permission, pending-invite
    │   ├── dto/                    invite-user, update-user, update-user-status
    │   ├── dao/users.dao.ts
    │   ├── users.service.ts
    │   ├── users.controller.ts
    │   ├── invites.controller.ts
    │   ├── users.module.ts
    │   └── index.ts
    │
    ├── roles/
    │   ├── entities/               role, role-permission
    │   ├── dto/                    create-role, update-role
    │   ├── dao/roles.dao.ts
    │   ├── roles.service.ts
    │   ├── roles.controller.ts
    │   ├── roles.module.ts
    │   └── index.ts
    │
    ├── permissions/
    │   ├── entities/               module, submodule, permission
    │   ├── dto/                    upsert-role-permissions
    │   ├── dao/permissions.dao.ts
    │   ├── permissions.service.ts
    │   ├── permissions.controller.ts
    │   ├── permissions.module.ts
    │   └── index.ts
    │
    ├── activity-logs/
    │   ├── entities/               activity-log
    │   ├── dao/activity-logs.dao.ts
    │   ├── activity-logs.service.ts
    │   ├── activity-logs.controller.ts
    │   ├── activity-logs.module.ts
    │   └── index.ts
    │
    └── mail/
        ├── mail.service.ts         Nodemailer wrapper (sendOtp, sendInvite)
        ├── mail.module.ts
        └── index.ts
```

---

## API Reference

All routes are prefixed with `/api`.  
All routes except `POST /api/auth/*` require `Authorization: Bearer <session_token>`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Request OTP to email |
| `POST` | `/api/auth/verify-otp` | Public | Verify OTP → session or challenge |
| `POST` | `/api/auth/resolve-challenge` | Public | Accept / reject device conflict |
| `POST` | `/api/auth/logout` | Required | Revoke current session |
| `GET` | `/api/auth/me` | Required | Current user with role + permissions |

**OTP login flow:**
```
POST /api/auth/login { email }
POST /api/auth/verify-otp { email, otp }
  → { token_type: "session", session_token, user }       // no conflict
  → { token_type: "challenge", challenge_token, ... }    // active session exists

POST /api/auth/resolve-challenge { challenge_token, accept: true }
  → { session_token, user }   // old session revoked, new session issued
```

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users` | List users (search, role_id, status, page, limit) |
| `GET` | `/api/users/stats` | Total, active, roles, pending invites counts |
| `GET` | `/api/users/:id` | User detail with role + effective permissions |
| `POST` | `/api/users/invite` | Create pending invite + send invite email |
| `PATCH` | `/api/users/:id` | Update profile fields |
| `PATCH` | `/api/users/:id/status` | Toggle active / inactive |
| `DELETE` | `/api/users/:id` | Soft delete |
| `PATCH` | `/api/users/bulk-deactivate` | Deactivate multiple users by ID |
| `GET` | `/api/users/:id/permissions` | Per-user permission overrides |
| `PUT` | `/api/users/:id/permissions` | Upsert per-user permission overrides |
| `GET` | `/api/invites` | List pending invites |
| `DELETE` | `/api/invites/:id` | Revoke a pending invite |

### Roles

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/roles` | List all roles with user counts |
| `GET` | `/api/roles/:id` | Role detail with flattened permission matrix |
| `POST` | `/api/roles` | Create role |
| `PATCH` | `/api/roles/:id` | Update role label / color / description |
| `DELETE` | `/api/roles/:id` | Delete role (blocked if users are assigned) |
| `GET` | `/api/roles/:id/permissions` | Raw role-permission rows |
| `PUT` | `/api/roles/:id/permissions` | Replace all permissions for a role |

### Permissions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/permissions` | List all permission actions |
| `GET` | `/api/permissions/modules` | List modules with nested submodules |

### Activity Logs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/activity-logs` | Paginated audit trail (filters: user_id, module_id, action, date range) |
| `GET` | `/api/activity-logs/export` | Export filtered logs as CSV download |

---

## Priority Queue System (P0–P7)

All async tasks are routed through BullMQ priority queues. Lower number = higher priority.

| Queue | Concurrency | Intended Use |
|---|---|---|
| P0 | 10 | **Critical** — OTP emails, security-sensitive auth tasks |
| P1 | 5 | High — time-sensitive user-triggered actions |
| P2 | 5 | Above normal |
| P3 | 5 | **Normal** — invite emails, standard notifications |
| P4 | 3 | Below normal |
| P5 | 3 | Low — bulk operations |
| P6 | 2 | Background — reports, analytics |
| P7 | 2 | **Batch** — long-running or deferred exports |

Each queue has its own dedicated worker running in parallel.  
The `PriorityQueueProducer` exposes `enqueue(priority, jobName, data)` for custom routing.

---

## Seeded Data

After `npm run db:migrate && npm run db:seed` (or `npm run db:refresh`):

**Roles**

| name | label | is_system | Access |
|---|---|---|---|
| `superadmin` | Super Admin | yes | All 12 actions on all 9 modules |
| `admin` | Admin | yes | view, create, edit, approve, export on all 9 modules |

**Modules (9):** `journal_entry`, `claims`, `billing`, `reinsurance`, `mga`, `compliance`, `period_locking`, `audit_trail`, `user_management`

**Permission Actions (12):** `view`, `create`, `edit`, `approve`, `export`, `post`, `file`, `lock`, `override`, `reconcile`, `void`, `reverse`

---

## Security

| Concern | Implementation |
|---|---|
| HTTP headers | `helmet()` — sets X-Frame-Options, HSTS, CSP, etc. |
| CORS | `enableCors()` with configurable origin |
| Input validation | `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true` |
| Auth | Session token in `Authorization: Bearer` header; validated per request |
| Rate limiting | Global `ThrottlerGuard` (default + short-burst tiers) |
| Swagger | Disabled automatically when `NODE_ENV=production` |
| Bull Board | HTTP Basic Auth on dashboard path |

---

## Testing

```bash
# Unit tests (mocked DAOs, factory function pattern)
npm test
npm run test:cov

# E2E tests (real PostgreSQL test DB)
npm run test:db:refresh     # Drop → recreate → migrate → seed test DB
npm run test:e2e
```

See [docs/TESTING.md](./docs/TESTING.md) for full details.

---

## Code Quality Hooks

On every `git commit`, Husky runs automatically:
- **pre-commit** → `lint-staged` (ESLint + Prettier on staged files)
- **commit-msg** → `commitlint` (enforces Conventional Commits format)

Valid commit message examples:
```
feat(users): add bulk deactivate endpoint
fix(auth): handle expired OTP gracefully
chore: update dependencies
```

---

## Documentation

Full module-level documentation is in [docs/](./docs/):

| File | Contents |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Project structure, module dependency graph |
| [AUTH_MODULE.md](./docs/AUTH_MODULE.md) | OTP login, challenge flow, session auth |
| [USERS_MODULE.md](./docs/USERS_MODULE.md) | User CRUD, invites, permissions |
| [ROLES_MODULE.md](./docs/ROLES_MODULE.md) | Role management, permission matrix |
| [PERMISSIONS_MODULE.md](./docs/PERMISSIONS_MODULE.md) | Module/submodule/permission catalog |
| [ACTIVITY_LOGS_MODULE.md](./docs/ACTIVITY_LOGS_MODULE.md) | Audit logging, CSV export |
| [BULL_QUEUE.md](./docs/BULL_QUEUE.md) | BullMQ priority queues, Redis setup |
| [RATE_LIMITING.md](./docs/RATE_LIMITING.md) | Throttler tiers, configuration |
| [BASE_ENTITY.md](./docs/BASE_ENTITY.md) | Abstract entity hierarchy |
| [ENV_SETUP.md](./docs/ENV_SETUP.md) | All environment variables |
| [LINTING_SETUP.md](./docs/LINTING_SETUP.md) | ESLint, Prettier, Husky, Commitlint |
| [TESTING.md](./docs/TESTING.md) | Unit test pattern, e2e setup, helpers |
