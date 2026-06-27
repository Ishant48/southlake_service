# Auth Module

**Location:** `src/modules/auth/`

Handles session-based authentication using a two-step OTP flow with support for concurrent session challenges.

---

## Entities

| Entity | File | Purpose |
|--------|------|---------|
| `LoginOtp` | `entities/login-otp.entity.ts` | Stores bcrypt-hashed OTP with expiry and attempt tracking |
| `UserSession` | `entities/user-session.entity.ts` | Active session tokens with expiry and device metadata |
| `LoginChallenge` | `entities/login-challenge.entity.ts` | Pending challenge when a second login is attempted on an active session |

---

## Auth Flow

### Step 1 — Login

```
POST /api/auth/login
{ email, password }
```

1. Lookup user by email, verify bcrypt password
2. Check user is `active`
3. Check OTP rate limit (configurable `OTP_MAX_ATTEMPTS`)
4. Generate 6-digit OTP, bcrypt hash it, save with expiry
5. Send OTP to email via `MailService.sendOtp()`
6. Log activity: `otp_requested`
7. Return `{ message: 'OTP sent to your email.' }`

---

### Step 2 — Verify OTP

```
POST /api/auth/verify-otp
{ email, otp, device_label? }
```

1. Find active (non-expired, non-used) OTP record
2. Check attempt count < max
3. Verify OTP against bcrypt hash; increment attempt on failure
4. Mark OTP as used
5. Fetch user; check `active` status
6. **If no existing session** → create session, return `{ token_type: 'session', session_token }`
7. **If existing active session** → create `LoginChallenge`, return `{ token_type: 'challenge', challenge_token }`

---

### Step 2b — Resolve Challenge (concurrent session)

```
POST /api/auth/resolve-challenge
{ challenge_token, accept: boolean }
```

- `accept: false` → challenge rejected, existing session preserved
- `accept: true` → existing session revoked (`displaced`), new session created
- Expired challenges → challenge marked `expired`, throws 401

---

### Other Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Returns the current authenticated user |
| POST | `/api/auth/logout` | Revokes the current session (`logout`) |

---

## Session Token Auth

The `AuthGuard` (`src/common/guards/auth.guard.ts`) extracts the Bearer token from `Authorization` header, looks up `UserSession` by token, verifies:
- Session `isActive === true`
- Session not expired (`expiresAt > now`)

The resolved `UserSession` (with `user` relation) is attached to `req.session`.  
The resolved `User` is accessible via `@CurrentUser()` decorator.

---

## Configuration

| Env var | Config key | Default | Purpose |
|---------|-----------|---------|---------|
| `OTP_EXPIRY_MINUTES` | `app.otpExpiryMinutes` | `5` | OTP validity window |
| `OTP_MAX_ATTEMPTS` | `app.otpMaxAttempts` | `5` | Max wrong OTP tries before lockout |
| `SESSION_EXPIRY_HOURS` | `app.sessionExpiryHours` | `24` | Session lifetime |

---

## DAO Methods (`auth.dao.ts`)

| Method | Purpose |
|--------|---------|
| `findUserWithPasswordByEmail` | Returns user with `passwordHash` included |
| `findUserByEmail` / `findUserById` | Standard user lookup |
| `countRecentOtps` | Rate limit check |
| `saveOtp` / `findActiveOtp` / `markOtpUsed` / `incrementOtpAttempt` | OTP lifecycle |
| `findActiveSessionForUser` / `saveSession` / `revokeSession` / `findSessionById` | Session management |
| `saveChallenge` / `findChallenge` / `resolveChallenge` | Challenge flow |

---

## Unit Tests

**File:** `src/modules/auth/auth.service.spec.ts`

Tests cover all service methods with factory-function mocks:
- `createMockUser()`, `createMockOtp()`, `createMockSession()`, `createMockChallenge()`
- `login`: bad user, wrong password, inactive, rate limit, success
- `verifyOtp`: missing OTP, max attempts, wrong OTP, success, inactive user, existing session → challenge
- `resolveChallenge`: not found, expired, rejected, accepted
- `logout`: revokes session, logs activity
- `getMe`: returns current user

---

## Related Documentation

- [Users Module](./USERS_MODULE.md)
- [Bull Queue](./BULL_QUEUE.md)
- [Testing Guide](./TESTING.md)
