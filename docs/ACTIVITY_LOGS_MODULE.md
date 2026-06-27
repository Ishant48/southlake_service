# Activity Logs Module

**Location:** `src/modules/activity-logs/`

Records all significant user actions across the system for audit purposes. Supports paginated querying and CSV export.

---

## Entity

| Entity | File | Base | Purpose |
|--------|------|------|---------|
| `ActivityLog` | `entities/activity-log.entity.ts` | `AuditableEntity` | Single audit event record |

### ActivityLog Fields

| Column | Type | Description |
|--------|------|-------------|
| `userId` | uuid (nullable) | Who performed the action |
| `moduleId` | string (nullable) | Which module (e.g., `user_management`) |
| `submoduleId` | string (nullable) | Optional submodule |
| `action` | string | Action type: `create`, `edit`, `delete`, `login`, `logout`, `otp_requested`, … |
| `entityType` | string (nullable) | What kind of record was affected (e.g., `user`, `role`) |
| `entityId` | uuid (nullable) | ID of the affected record |
| `description` | string (nullable) | Human-readable description |
| `ipAddress` | string (nullable) | Request IP |
| `userAgent` | string (nullable) | Request User-Agent |

---

## Endpoints (`/api/activity-logs`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/activity-logs` | Paginated log list; query: `page`, `limit`, `userId`, `moduleId`, `action`, `from`, `to` |
| GET | `/api/activity-logs/export` | Returns CSV download of filtered logs |

---

## Recording Logs

Every service that mutates data calls `ActivityLogsService.log(entry)`.

```typescript
await this.activityLogsService.log({
  userId: actor.id,
  moduleId: 'user_management',
  action: 'delete',
  entityType: 'user',
  entityId: userId,
  description: `Deleted user ${user.name}`,
  ipAddress: req?.ip,
  userAgent: req?.headers?.['user-agent'],
});
```

All fields except `action` are optional and default to `null`.

### Automatic Logging via AuditInterceptor

The `AuditInterceptor` (`src/common/interceptors/audit.interceptor.ts`) automatically records HTTP request outcomes for mutating methods (POST, PATCH, PUT, DELETE) without requiring explicit calls in each service.

---

## CSV Export

`GET /api/activity-logs/export` streams a CSV with columns:

```
Date, User, Email, Module, Action, Entity Type, Entity ID, Description, IP Address
```

Commas in `description` are replaced with semicolons to keep CSV columns intact.

---

## Service Methods (`activity-logs.service.ts`)

| Method | Description |
|--------|-------------|
| `log(entry)` | Saves a single audit log entry |
| `findAll(query)` | Paginated list with filters |
| `exportCsv(query)` | Returns a CSV string of all matching logs |

---

## Unit Tests

**File:** `src/modules/activity-logs/activity-logs.service.spec.ts`

Factory functions: `createMockLog()`, `createLogEntry()`

Tests cover: `log` (all fields passed, optional fields default to null, return value), `findAll` (pagination metadata), `exportCsv` (header row, data rows, comma escaping, empty result)

---

## Related Documentation

- [Auth Module](./AUTH_MODULE.md) — logs OTP requests, login, logout
- [Users Module](./USERS_MODULE.md) — logs user CRUD and invites
- [Roles Module](./ROLES_MODULE.md) — logs role CRUD and permission changes
- [Architecture Overview](./ARCHITECTURE.md)
