# Roles Module

**Location:** `src/modules/roles/`

Manages roles and their permission matrices. Roles are assigned to users and define the default access level. User-level overrides can extend or restrict role permissions.

---

## Entities

| Entity | File | Base | Purpose |
|--------|------|------|---------|
| `Role` | `entities/role.entity.ts` | `AuditableEntity` | Role definition with name, label, color |
| `RolePermission` | `entities/role-permission.entity.ts` | `AuditableEntity` | Maps role → module → submodule → permission |

---

## Endpoints (`/api/roles`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/roles` | Paginated list with `user_count` per role; query: `page`, `limit` |
| GET | `/api/roles/:id` | Role detail with `user_count` and flattened permission matrix |
| POST | `/api/roles` | Create role; name must be unique |
| PATCH | `/api/roles/:id` | Update label, color, description |
| DELETE | `/api/roles/:id` | Delete role; fails if any users are assigned |
| PUT | `/api/roles/:id/permissions` | Replace all role permissions |

---

## Permission Matrix (flattened response)

The `GET /api/roles/:id` response flattens `RolePermission` records into a readable matrix grouped by module:

```json
{
  "id": "...",
  "name": "manager",
  "permissions": [
    {
      "module_id": "user_management",
      "view": true,
      "create": true,
      "edit": true,
      "delete": false,
      "export": false
    }
  ]
}
```

The flattening logic is in `RolesService.flattenPermissions()`.

---

## Service Methods (`roles.service.ts`)

| Method | Description |
|--------|-------------|
| `findAll(page, perPage)` | Paginated roles, each with `user_count` |
| `findOne(id)` | Role with `user_count` + flattened permissions; throws 404 |
| `create(dto, actor)` | Checks unique name; saves; logs activity |
| `update(id, dto, actor)` | Updates label/color/description; logs activity |
| `remove(id, actor)` | Checks no assigned users; deletes; logs activity |
| `upsertPermissions(roleId, entries, actor)` | Replaces role permission entries |
| `flattenPermissions(rawPerms)` | (private) Groups `RolePermission[]` by module into matrix |

---

## Role Protection Rules

- **Cannot delete** a role that has users assigned (`BadRequestException`)
- **Cannot create** a role with a name that already exists (`BadRequestException`)
- System roles (`isSystem: true`) are seeded via migration and should not be deleted via API (enforce in guard/policy)

---

## Unit Tests

**File:** `src/modules/roles/roles.service.spec.ts`

Factory functions: `createMockRole()`, `createMockUser()`, `createMockRolePermission()`

Tests cover: `findAll` with user counts, `findOne` with permissions flattening, `create` (duplicate name + success), `update` (404 + success), `remove` (404 + users assigned + success), `upsertPermissions`

---

## Related Documentation

- [Users Module](./USERS_MODULE.md) — user_count comes from Users
- [Permissions Module](./PERMISSIONS_MODULE.md) — module/permission catalog
- [Base Entity Pattern](./BASE_ENTITY.md)
- [Testing Guide](./TESTING.md)
