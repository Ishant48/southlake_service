# southlake-service

NestJS backend for the **Southlake Insurance** accounting platform.
Covers the **User Management** domain: identity, sessions, roles, permissions, audit trail, and email-OTP authentication.

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 24 |
| Framework | NestJS 11 |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL 15+ |
| Auth | Email OTP + opaque session tokens (no passwords, no 3rd-party IdP) |
| Email | Nodemailer (SMTP) |
| Docs | Swagger / OpenAPI at `/api/docs` |
| Validation | class-validator + class-transformer |
| Linting | ESLint 9 (flat config) + Prettier 3 |

---

## Prerequisites

- Node.js >= 24
- PostgreSQL >= 15 running locally (or via Docker)
- An SMTP account for sending OTP emails (Gmail, SendGrid, etc.)

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Create the database
createdb southlake_db   # or use your preferred Postgres client

# 4. Run migrations (creates schema + seeds Superadmin/Admin roles)
npm run migration:run

# 5. Start in dev mode (hot-reload)
npm run start:dev
```

The API is available at `http://localhost:3000/api`.
Swagger docs are at `http://localhost:3000/api/docs`.

---

## Environment variables

Copy `.env.example` to `.env` and fill in each value:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_HOST` | Postgres host | `localhost` |
| `DATABASE_PORT` | Postgres port | `5432` |
| `DATABASE_NAME` | Database name | `southlake_db` |
| `DATABASE_USER` | Postgres user | `postgres` |
| `DATABASE_PASSWORD` | Postgres password | `postgres` |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP username | |
| `MAIL_PASSWORD` | SMTP password / app password | |
| `MAIL_FROM` | From address shown on emails | `Southlake Insurance <noreply@southlake.com>` |
| `APP_URL` | Frontend base URL (used in invite links) | `http://localhost:4200` |
| `SESSION_EXPIRY_HOURS` | Session lifetime | `24` |
| `OTP_EXPIRY_MINUTES` | OTP TTL | `5` |
| `OTP_MAX_ATTEMPTS` | Failed attempts before OTP is locked | `5` |
| `PORT` | HTTP port | `3000` |

---

## Project structure

```
src/
├── app.module.ts               Root module
├── main.ts                     Bootstrap (Swagger, pipes, filters, helmet, CORS)
│
├── config/                     registerAs() config factories
│   ├── app.config.ts
│   ├── database.config.ts
│   └── mail.config.ts
│
├── common/                     Cross-cutting concerns
│   ├── decorators/
│   │   ├── current-user.decorator.ts   @CurrentUser() param decorator
│   │   └── roles.decorator.ts          @Roles() metadata decorator
│   ├── filters/
│   │   └── http-exception.filter.ts    Shapes all error responses
│   ├── guards/
│   │   ├── auth.guard.ts               Validates session_token from Bearer header
│   │   ├── auth-guard.module.ts        Module that provides AuthGuard
│   │   └── roles.guard.ts              Checks user role against @Roles() metadata
│   ├── interceptors/
│   │   ├── audit.interceptor.ts        Auto-logs mutating requests to activity_logs
│   │   └── audit.module.ts             Module that registers AuditInterceptor globally
│   └── pipes/
│       └── uuid-validation.pipe.ts     Validates UUID route params
│
├── entities/                   TypeORM entities (12 total, one per DBML table)
│   ├── role.entity.ts
│   ├── user.entity.ts
│   ├── module.entity.ts
│   ├── submodule.entity.ts
│   ├── permission.entity.ts
│   ├── role-permission.entity.ts
│   ├── user-permission.entity.ts
│   ├── login-otp.entity.ts
│   ├── user-session.entity.ts
│   ├── login-challenge.entity.ts
│   ├── pending-invite.entity.ts
│   └── activity-log.entity.ts
│
├── database/
│   ├── data-source.ts          TypeORM DataSource for CLI (migrations)
│   └── migrations/
│       ├── 001-initial-schema.ts   Creates all 12 IAM tables + indexes
│       └── 002-seed-roles-modules.ts  Seeds Superadmin, Admin, modules, permissions
│
└── modules/
    ├── auth/                   OTP request/verify, challenge flow, logout, /me
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── dao/auth.dao.ts
    │   └── dto/
    ├── users/                  User CRUD + invite + per-user permissions
    │   ├── users.module.ts
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   ├── dao/users.dao.ts
    │   └── dto/
    ├── roles/                  Role CRUD + role-level permissions matrix
    │   ├── roles.module.ts
    │   ├── roles.controller.ts
    │   ├── roles.service.ts
    │   ├── dao/roles.dao.ts
    │   └── dto/
    ├── permissions/            List permissions + modules
    │   ├── permissions.module.ts
    │   ├── permissions.controller.ts
    │   ├── permissions.service.ts
    │   └── dao/permissions.dao.ts
    ├── activity-logs/          Paginated audit trail
    │   ├── activity-logs.module.ts
    │   ├── activity-logs.controller.ts
    │   ├── activity-logs.service.ts
    │   └── dao/activity-logs.dao.ts
    └── mail/                   Nodemailer wrapper (OTP + invite emails)
        ├── mail.module.ts
        └── mail.service.ts
```

---

## API reference

All routes are prefixed with `/api`. Bearer token is required on all routes except the `/api/auth/*` endpoints.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/request-otp` | Send a 6-digit OTP to the given email |
| `POST` | `/api/auth/verify-otp` | Validate OTP; returns session or conflict challenge |
| `POST` | `/api/auth/resolve-challenge` | Accept/reject a single-device conflict |
| `POST` | `/api/auth/logout` | Revoke the current session |
| `GET` | `/api/auth/me` | Return the current user with role + permissions |

**Single-device login flow**

```
POST /api/auth/verify-otp
  -> { token_type: 'session', session_token, user }       // no conflict
  -> { token_type: 'challenge', challenge_token,           // conflict detected
       existing_device: { label, ip_address, created_at } }

POST /api/auth/resolve-challenge { challenge_token, accept: true }
  -> { session_token, user }   // old session displaced, new session created

POST /api/auth/resolve-challenge { challenge_token, accept: false }
  -> 200 { message: 'Login cancelled' }
```

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users` | List users (search, role_id, status, page, limit) |
| `GET` | `/api/users/:id` | Get user with role + effective permissions |
| `POST` | `/api/users/invite` | Create pending invite + send invite email |
| `PATCH` | `/api/users/:id` | Update user profile fields |
| `PATCH` | `/api/users/:id/status` | Toggle active / inactive |
| `DELETE` | `/api/users/:id` | Soft delete |
| `GET` | `/api/users/:id/permissions` | Get per-user permission overrides |
| `PUT` | `/api/users/:id/permissions` | Upsert per-user permission overrides |

### Roles

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/roles` | List all roles |
| `POST` | `/api/roles` | Create a role |
| `PATCH` | `/api/roles/:id` | Update role name/label/color/description |
| `DELETE` | `/api/roles/:id` | Delete role (blocked if users are assigned) |
| `GET` | `/api/roles/:id/permissions` | Get all role-permission rows |
| `PUT` | `/api/roles/:id/permissions` | Replace all permissions for a role |

### Permissions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/permissions` | List all permission action records |
| `GET` | `/api/permissions/modules` | List all modules with nested submodules |

### Activity logs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/activity-logs` | Paginated list (user_id, module_id, action, from_date, to_date, page, limit) |

---

## Seeded data (Migration 002)

After running migrations the database contains:

**Roles**
| name | label | is_system | Permissions |
|---|---|---|---|
| `superadmin` | Super Admin | yes | All 12 actions on all 9 modules |
| `admin` | Admin | yes | view, create, edit, approve, export on all 9 modules |

**Modules** (9): `journal_entry`, `claims`, `billing`, `reinsurance`, `mga`, `compliance`, `period_locking`, `audit_trail`, `user_management`

**Permissions / actions** (12): `view`, `create`, `edit`, `approve`, `export`, `post`, `file`, `lock`, `override`, `reconcile`, `void`, `reverse`

---

## Database migrations

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration from entity changes (auto-detects diff)
npm run migration:generate -- src/database/migrations/NNN-description

# Create an empty migration file
npm run migration:create -- src/database/migrations/NNN-description
```

`synchronize` is **always `false`** in TypeORM config. All schema changes must go through migrations.

---

## Code quality

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix

# Format source files with Prettier
npm run format

# Check formatting without writing
npm run format:check
```

VSCode will auto-format and auto-fix on save if the recommended extensions are installed:
- **esbenp.prettier-vscode** (Prettier)
- **dbaeumer.vscode-eslint** (ESLint)

Install them once with:

```bash
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
```

---

## Architecture notes

- **DAO layer**: Every module has a `dao/` folder. Services call DAOs; DAOs own all TypeORM repository queries. Services never import `Repository` directly.
- **AuditInterceptor**: Registered globally (`APP_INTERCEPTOR`). Auto-logs every `POST`, `PATCH`, `PUT`, `DELETE` request to `activity_logs` when an authenticated user is present.
- **AuthGuard**: Reads `Authorization: Bearer <token>`, validates against `user_sessions` (is_active + not expired), attaches `req.user`.
- **OTP rate-limiting**: The DAO enforces a max of 3 OTP requests per email per 15 minutes via a `login_otps` count query (no Redis needed).
- **Single-device enforcement**: On OTP verify, if an active session already exists the service creates a `login_challenges` row (TTL: 10 min) and returns a `challenge_token`. The frontend shows a conflict dialog; the user resolves it via `/resolve-challenge`.
