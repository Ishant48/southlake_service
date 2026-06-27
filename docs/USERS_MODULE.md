# Users Module

**Location:** `src/modules/users/`

Manages user accounts, invite-based onboarding, user-level permission overrides, and bulk status operations.

---

## Entities

| Entity | File | Base | Purpose |
|--------|------|------|---------|
| `User` | `entities/user.entity.ts` | `SoftDeleteEntity` | Core user record with role, status, password hash |
| `UserPermission` | `entities/user-permission.entity.ts` | `AuditableEntity` | Per-user permission grants/denials that override role defaults |
| `PendingInvite` | `entities/pending-invite.entity.ts` | `AuditableEntity` | Email invites with token, expiry, and accepted/revoked status |

---

## Endpoints

### Users Controller (`/api/users`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | Paginated list; query params: `page`, `limit`, `search`, `status`, `role_id`, `user_type` |
| GET | `/api/users/stats` | Aggregate stats: total, active, roles_defined, pending_invites |
| GET | `/api/users/:id` | Single user by ID |
| PATCH | `/api/users/:id` | Update name, role, user_type |
| PATCH | `/api/users/:id/status` | Change status (`active` / `inactive`) |
| DELETE | `/api/users/:id` | Soft delete |
| POST | `/api/users/bulk-deactivate` | Deactivate multiple users by ID array |
| GET | `/api/users/:id/permissions` | User-specific permission overrides |
| PUT | `/api/users/:id/permissions` | Upsert permission overrides |

### Invites Controller (`/api/users/invite`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users/invite` | Send invite email, create PendingInvite record |
| GET | `/api/users/invites` | List pending invites |
| DELETE | `/api/users/invites/:id` | Revoke invite |

---

## Invite Flow

```
Admin → POST /api/users/invite
         ↓
   check: user with email already exists? → 400
         ↓
   generate UUID invite token
   save PendingInvite (status: pending, expiresAt: +7d)
         ↓
   MailService.sendInvite(email, name, acceptUrl, invitedByName)
         ↓
   Return { message: 'Invite sent to <email>' }
```

The invite link is `${APP_URL}/accept-invite?token=<token>`.  
Accept-invite endpoint (separate flow) verifies token, creates user account, marks invite `accepted`.

---

## User Permissions (Override Model)

User permissions **extend or override** role-level permissions:

| `accessType` | Meaning |
|-------------|---------|
| `grant` | Grant this action even if role denies it |
| `deny` | Deny this action even if role grants it |

```typescript
// Upsert example
PUT /api/users/:id/permissions
[
  { moduleId: 'user_management', permissionId: '<uuid>', accessType: 'grant' }
]
```

---

## Service Methods (`users.service.ts`)

| Method | Description |
|--------|-------------|
| `getStats()` | Delegates to `UsersDao.getStats()` |
| `findAll(query)` | Paginated list with filters |
| `findOne(id)` | Find by ID or throw `NotFoundException` |
| `invite(dto, actor)` | Invite flow — checks duplicates, saves invite, sends email |
| `update(id, dto, actor)` | Update name/role/userType; logs activity |
| `updateStatus(id, dto, actor)` | Update status; logs activity |
| `deactivate(id, actor)` | Sets status to `inactive` |
| `remove(id, actor)` | Soft delete via `UsersDao.softDelete()` |
| `deactivateBulk(ids, actor)` | Bulk deactivation |
| `upsertPermissions(id, entries, actor)` | Replaces user permission overrides |
| `revokeInvite(inviteId, actor)` | Marks invite revoked |

---

## Soft Delete Behaviour

- `DELETE /api/users/:id` sets `isDeleted = true`, `deletedAt = now()`, `deletedBy = actor.id`
- All `findAll` and `findById` queries filter `WHERE is_deleted = false`
- Deleted users cannot log in (auth guard checks `status: active` which is set to `inactive` before soft delete)

---

## Unit Tests

**File:** `src/modules/users/users.service.spec.ts`

Factory functions: `createMockUser()`, `createMockPermission()`, `createMockInvite()`

Tests cover: `getStats`, `findAll` pagination, `findOne`, `invite` (duplicate check + success), `update`, `updateStatus`, `deactivate`, `remove`, `deactivateBulk`, `upsertPermissions`, `revokeInvite`

---

## Related Documentation

- [Auth Module](./AUTH_MODULE.md)
- [Roles Module](./ROLES_MODULE.md)
- [Base Entity Pattern](./BASE_ENTITY.md)
- [Testing Guide](./TESTING.md)
