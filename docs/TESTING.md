# Testing Guide

## Overview

The project has two test layers:

| Layer | Runner config | Scope | DB needed |
|-------|--------------|-------|-----------|
| Unit tests | `jest` (default config in `package.json`) | Individual services with mocked deps | No |
| E2E tests | `test/jest-e2e.json` | Full HTTP stack against real test DB | Yes |

---

## Unit Tests

**Pattern:** Factory functions + mocked DAOs

**Files:** `src/modules/**/*.service.spec.ts`

### Structure

```typescript
// 1. Constants
const TEST_USER_ID = 'user-test-uuid';
const TEST_DATE = new Date('2025-01-01T00:00:00.000Z');

// 2. Factory functions — return typed mock objects with sensible defaults
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: TEST_USER_ID,
  email: 'user@southlake.com',
  status: 'active',
  ...overrides,
} as User);

// 3. Mock implementations — plain objects with jest.fn() methods
const mockUsersDao = {
  findById: jest.fn(),
  save: jest.fn(),
  ...
};

// 4. beforeEach — rebuild module + jest.clearAllMocks() + set sensible defaults
beforeEach(async () => {
  const module = await Test.createTestingModule({ ... }).compile();
  service = module.get(UsersService);
  jest.clearAllMocks();
  mockActivityLogsService.log.mockResolvedValue(undefined);
});

// 5. Tests grouped by method
describe('findOne', () => {
  it('should throw NotFoundException when user does not exist', async () => {
    mockUsersDao.findById.mockResolvedValue(null);
    await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
  });
});
```

### Running Unit Tests

```bash
npm test                  # run all unit tests once
npm run test:watch        # watch mode
npm run test:cov          # with coverage report
```

### Current Coverage

| File | Tests |
|------|-------|
| `auth.service.spec.ts` | login, verifyOtp, resolveChallenge, logout, getMe |
| `users.service.spec.ts` | getStats, findAll, findOne, invite, update, updateStatus, deactivate, remove, deactivateBulk, upsertPermissions, revokeInvite |
| `roles.service.spec.ts` | findAll, findOne (with permission flattening), create, update, remove, upsertPermissions |
| `mail.service.spec.ts` | sendOtp, sendInvite (nodemailer mocked) |
| `activity-logs.service.spec.ts` | log, findAll, exportCsv |

**Total: 63 tests, all passing**

---

## E2E Tests

**Pattern:** Real HTTP requests via `supertest` against a real PostgreSQL test database.

**Files:** `test/**/*.e2e-spec.ts`

### Setup

1. **Create the test database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE southlake_test_db;"
   ```

2. **Run migrations against test DB:**
   ```bash
   npm run test:db:migrate
   ```

3. **Copy `.env.example` → `.env.test`** and set:
   ```env
   NODE_ENV=test
   DATABASE_NAME=southlake_test_db
   RATE_LIMIT_MAX=1000
   LOG_LEVEL=error
   ```

4. **Run e2e tests:**
   ```bash
   npm run test:e2e
   ```

---

### Test Helpers

#### `DbHelper` (`test/helpers/db.helper.ts`)

Provides seed and cleanup utilities using the TypeORM `DataSource`:

```typescript
const db = new DbHelper(dataSource);

// Seed
const role = await db.createRole({ name: 'manager', label: 'Manager' });
const user = await db.createUser(role.id, { email: 'test@x.com', password: 'pass' });

// Cleanup
await db.cleanAll(['test@x.com'], ['manager']);
```

#### `AuthHelper` (`test/helpers/auth.helper.ts`)

Handles the full two-step OTP login flow:

```typescript
const auth = new AuthHelper(app, db);
const { sessionToken, userId } = await auth.loginWithCredentials(email, password);
```

**How it works:**
1. POST `/api/auth/login` (triggers OTP email)
2. Read the latest OTP record directly from DB
3. Overwrite `otpHash` with bcrypt hash of known value `'999999'`
4. POST `/api/auth/verify-otp` with `otp: '999999'`
5. Returns `{ sessionToken, userId }`

This avoids needing a real mail server in tests.

---

### Test Data Isolation

Each test suite uses a unique email domain suffix to avoid conflicts:

```typescript
const AUTH_DOMAIN = '@test.auth.e2e';    // auth.e2e-spec.ts
const USERS_DOMAIN = '@test.users.e2e';  // users.e2e-spec.ts
const ROLES_DOMAIN = '@test.roles.e2e';  // roles.e2e-spec.ts
```

All seeded data is cleaned up in `afterAll`:

```typescript
afterAll(async () => {
  await db.cleanAll([testEmail], [testRoleName]);
  await app.close();
});
```

---

### E2E Test Coverage

| File | Endpoints covered |
|------|------------------|
| `app.e2e-spec.ts` | 404 on unknown route, 401 on protected route, 400 on missing body |
| `auth.e2e-spec.ts` | POST login, POST verify-otp, GET me, POST logout |
| `users.e2e-spec.ts` | GET list/stats/detail, PATCH update/status, POST invite, DELETE user |
| `roles.e2e-spec.ts` | GET list/detail, POST create, PATCH update, DELETE role, PUT permissions |

---

## Scripts Reference

```bash
npm test                    # unit tests
npm run test:e2e            # e2e tests (loads .env.test via dotenv-cli)
npm run test:db:migrate     # run migrations against test DB
npm run test:db:reset       # revert last migration on test DB
```

---

## Related Documentation

- [Auth Module](./AUTH_MODULE.md)
- [Environment Configuration](./ENV_SETUP.md)
- [Architecture Overview](./ARCHITECTURE.md)
