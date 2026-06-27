# Southlake Service — Documentation

NestJS-based IAM (Identity & Access Management) backend for Southlake Insurance.

## Available Documentation

### Architecture & Structure

- [Architecture Overview](./ARCHITECTURE.md) — Project structure, module layout, entity locations
- [Base Entity Pattern](./BASE_ENTITY.md) — Abstract base classes (BaseEntity, AuditableEntity, SoftDeleteEntity)

### Modules

- [Auth Module](./AUTH_MODULE.md) — Session-based login with OTP, challenge flow, session management
- [Users Module](./USERS_MODULE.md) — User CRUD, invites, permissions, bulk operations
- [Roles Module](./ROLES_MODULE.md) — Role management, permission matrix
- [Permissions Module](./PERMISSIONS_MODULE.md) — Module/submodule/permission catalog
- [Activity Logs Module](./ACTIVITY_LOGS_MODULE.md) — Audit log recording and CSV export

### Infrastructure

- [Bull Queue (Async Mail)](./BULL_QUEUE.md) — BullMQ mail producer/processor, Redis setup
- [Rate Limiting](./RATE_LIMITING.md) — Throttler configuration, tiers
- [Environment Configuration](./ENV_SETUP.md) — Env vars, runtime validation
- [Linting & Code Quality](./LINTING_SETUP.md) — ESLint, Prettier, Husky, Commitlint

### Testing

- [Testing Guide](./TESTING.md) — Unit tests (factory pattern), e2e tests (real DB), test scripts

---

> Logic is never changed during structure improvement passes — all service and DAO behaviour remains identical.
