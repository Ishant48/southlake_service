# Permissions Module

**Location:** `src/modules/permissions/`

Provides the read-only catalog of modules, submodules, and permissions available in the system. This data is used when assigning role permissions or user permission overrides.

---

## Entities

| Entity | File | Base | Purpose |
|--------|------|------|---------|
| `Module` | `entities/module.entity.ts` | `BaseEntity` | Top-level functional area (e.g., `user_management`) |
| `Submodule` | `entities/submodule.entity.ts` | `BaseEntity` | Optional sub-area within a module |
| `Permission` | `entities/permission.entity.ts` | `BaseEntity` | Specific action (e.g., `view`, `create`, `edit`, `delete`, `export`) |

---

## Endpoints (`/api/permissions`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/permissions/modules` | All modules with their submodules |
| GET | `/api/permissions` | All available permission actions |

These endpoints are read-only. Modules, submodules, and permissions are seeded via database migrations — they are not managed through the API.

---

## Data Model

```
Module
 ├── id (uuid)
 ├── name (e.g., "user_management")
 ├── label (e.g., "User Management")
 └── submodules: Submodule[]

Submodule
 ├── id (uuid)
 ├── moduleId → Module.id
 ├── name (e.g., "invites")
 └── label (e.g., "Invites")

Permission
 ├── id (uuid)
 ├── action (e.g., "view", "create", "edit", "delete", "export")
 └── label (e.g., "View", "Create")
```

---

## How Permissions Are Used

**Role permissions** (`role_permissions` table) link a role to a specific `moduleId`, optional `submoduleId`, and `permissionId`.

**User permissions** (`user_permissions` table) add overrides per user for the same combination.

When the access control guard evaluates a request it:
1. Looks up the user's role permissions
2. Applies any user-level grant/deny overrides
3. Allows or rejects the request

---

## DAO Methods (`permissions.dao.ts`)

| Method | Description |
|--------|-------------|
| `findAllModules()` | Returns modules with nested submodules |
| `findAllPermissions()` | Returns all permission actions |

---

## Related Documentation

- [Roles Module](./ROLES_MODULE.md) — role_permissions uses this catalog
- [Users Module](./USERS_MODULE.md) — user_permissions uses this catalog
- [Architecture Overview](./ARCHITECTURE.md)
