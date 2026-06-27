# Base Entity Pattern

## Overview

All TypeORM entities extend one of three abstract base classes in `src/common/entities/`.  
This eliminates repeated `id`, `createdAt`, `updatedAt`, and audit fields across entity files.

## Hierarchy

```
BaseEntity
  └── AuditableEntity  (adds createdBy, updatedBy)
        └── SoftDeleteEntity  (adds isDeleted, deletedAt, deletedBy)
```

---

## BaseEntity

**File:** `src/common/entities/base.entity.ts`

```typescript
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
```

Use for entities that need only identity and timestamps. No foreign-key audit trail.

**Entities using BaseEntity:** `LoginOtp`, `UserSession`, `LoginChallenge`, `Permission`, `Module`, `Submodule`

---

## AuditableEntity

**File:** `src/common/entities/auditable.entity.ts`

```typescript
export abstract class AuditableEntity extends BaseEntity {
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
}
```

Use for entities that need a record of which user created/last modified them.

**Entities using AuditableEntity:** `Role`, `RolePermission`, `UserPermission`, `PendingInvite`, `ActivityLog`

---

## SoftDeleteEntity

**File:** `src/common/entities/soft-delete.entity.ts`

```typescript
export abstract class SoftDeleteEntity extends AuditableEntity {
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string;
}
```

Use for entities that must survive deletion — they are flagged, not removed.

**Entities using SoftDeleteEntity:** `User`

---

## Creating a New Entity

### Step 1 — Choose the right base class

| Need | Base class |
|------|-----------|
| Just id + timestamps | `BaseEntity` |
| Track who created/updated | `AuditableEntity` |
| Support soft delete | `SoftDeleteEntity` |

### Step 2 — Place the file in the owning module

```
src/modules/<module-name>/entities/<name>.entity.ts
```

### Step 3 — Write the entity

```typescript
import { Column, Entity } from 'typeorm';
import { AuditableEntity } from '../../../common/entities';

@Entity('tags')
export class Tag extends AuditableEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;
}
```

### Step 4 — Register in the module

```typescript
TypeOrmModule.forFeature([Tag])
```

> The TypeORM CLI DataSource uses the glob `modules/**/*.entity.{ts,js}`, so new entities are picked up automatically for migrations.

---

## Column Naming Convention

All base columns use snake_case `name` overrides to match the PostgreSQL schema:

| TypeScript property | DB column |
|--------------------|-----------|
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `createdBy` | `created_by` |
| `updatedBy` | `updated_by` |
| `isDeleted` | `is_deleted` |
| `deletedAt` | `deleted_at` |
| `deletedBy` | `deleted_by` |

---

## Benefits

- **No duplication** — shared fields defined once
- **Consistent schema** — every entity has the same base columns
- **Type safety** — TypeScript inheritance guarantees base fields exist
- **Migration-safe** — `synchronize: false`, schema comes from explicit migrations only

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Users Module](./USERS_MODULE.md)
- [Roles Module](./ROLES_MODULE.md)
