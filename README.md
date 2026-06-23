# Southlake User Management API

RBAC-based user management system built with NestJS.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (v18+), NestJS 10 |
| ORM | TypeORM (synchronize: true) |
| Database | PostgreSQL |
| Auth | JWT (24h expiry) + bcrypt |
| Validation | class-validator + ValidationPipe |
| Docs | Swagger at `/docs` |

## Setup

### Environment Variables (.env)

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/southlake_user_mgmt
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SUPER_ADMIN_EMAIL=admin@southlake.com
SUPER_ADMIN_PASSWORD=Admin@123
SUPER_ADMIN_USERNAME=superadmin
```

### Commands

```bash
npm install
npm run build
npm run start:dev
```

Server starts at `http://localhost:3001`. Swagger at `http://localhost:3001/docs`.

## Auth Mechanism

- **JwtAuthGuard** (global): extracts `Bearer` token from `Authorization` header, verifies JWT, attaches `{ sub, email, username, isSuperAdmin }` to `req.user`.
- **AuthorizationGuard** (global): loads user permissions from DB. Super admin bypasses. Non-super admin users are checked for endpoint-level access via role and user-level overrides.
- **@Public()**: exceptions `POST /api/auth/login`.

### How to Access Protected Endpoints

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Default Seed Data

On first startup, the seeder creates:

### Super Admin User

| Field | Value |
|-------|-------|
| Username | `superadmin` (configurable) |
| Email | `admin@southlake.com` (configurable) |
| Password | `Admin@123` (configurable) |
| Role | SuperAdmin |
| isSuperAdmin | `true` |

### Modules (5)

| Name | Description |
|------|-------------|
| Auth | Authentication and authorization |
| Users | User management |
| Roles | Role management |
| Modules | Module listing |
| Api Endpoints | API endpoint listing |


### Api Endpoints (19)

| Module | Method | Path | Name |
|--------|--------|------|------|
| Auth | POST | /api/auth/login | Login |
| Auth | GET | /api/auth/profile | Get Profile |
| Users | GET | /api/users | List Users |
| Users | GET | /api/users/:id | Get User |
| Users | POST | /api/users | Create User |
| Users | PATCH | /api/users/:id | Update User |
| Users | PATCH | /api/users/:id/status | Toggle User Status |
| Users | POST | /api/users/:id/endpoints | Assign User Endpoints |
| Users | POST | /api/users/:id/modules | Assign User Modules |
| Roles | GET | /api/roles | List Roles |
| Roles | GET | /api/roles/:id | Get Role |
| Roles | POST | /api/roles | Create Role |
| Roles | PATCH | /api/roles/:id | Update Role |
| Roles | DELETE | /api/roles/:id | Delete Role |
| Roles | POST | /api/roles/:id/endpoints | Assign Role Endpoints |
| Roles | POST | /api/roles/:id/modules | Assign Role Modules |
| Modules | GET | /api/modules | List Modules |
| Api Endpoints | GET | /api/api-endpoints | List All Endpoints |
| Api Endpoints | GET | /api/api-endpoints/by-module/:id | Endpoints By Module |

---

## API Reference

---

### GET /api

Auth: Required

**Request:** None

**Response 200:**
```json
"Hello World!"
```

---

### POST /api/auth/login

Auth: None (`@Public`)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | @IsEmail() |
| password | string | Yes | @IsString() |

**Example Request:**
```json
{
  "email": "admin@southlake.com",
  "password": "Admin@123"
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5Ac291dGhsYWtlLmNvbSIsInVzZXJuYW1lIjoic3VwZXJhZG1pbiIsImlzU3VwZXJBZG1pbiI6dHJ1ZSwiaWF0IjoxNzgyMjAzNjc0LCJleHAiOjE3ODIyOTAwNzR9.nE6C4BI-cYvoO7L2gBgUpTLFbLIp7e6PNuWAsn3tKpg",
  "user": {
    "id": 1,
    "username": "superadmin",
    "email": "admin@southlake.com",
    "isActive": true,
    "isSuperAdmin": true,
    "roleId": 1,
    "role": {
      "id": 1,
      "name": "SuperAdmin",
      "description": "Full system access",
      "createdAt": "2026-06-23T08:35:30.000Z"
    },
    "createdAt": "2026-06-23T08:35:30.000Z",
    "updatedAt": "2026-06-23T08:35:30.000Z"
  },
  "permissions": [
    {
      "moduleId": 1,
      "moduleName": "Auth",
      "endpoints": [
        { "id": 1, "method": "POST", "path": "/api/auth/login", "name": "Login" },
        { "id": 2, "method": "GET", "path": "/api/auth/profile", "name": "Get Profile" }
      ]
    }
  ]
}
```

**Response 401:**
```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### GET /api/auth/profile

Auth: Required

**Request Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "username": "superadmin",
    "email": "admin@southlake.com",
    "isActive": true,
    "isSuperAdmin": true,
    "roleId": 1,
    "role": {
      "id": 1,
      "name": "SuperAdmin",
      "description": "Full system access",
      "createdAt": "2026-06-23T08:35:30.000Z"
    },
    "createdAt": "2026-06-23T08:35:30.000Z",
    "updatedAt": "2026-06-23T08:35:30.000Z"
  },
  "permissions": [
    {
      "moduleId": 1,
      "moduleName": "Auth",
      "endpoints": [
        { "id": 1, "method": "POST", "path": "/api/auth/login", "name": "Login" }
      ]
    }
  ]
}
```

**Response 401:**
```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### GET /api/users

Auth: Required

**Request:** None (query params none)

**Response 200:**
```json
[
  {
    "id": 1,
    "username": "superadmin",
    "email": "admin@southlake.com",
    "isActive": true,
    "isSuperAdmin": true,
    "roleId": 1,
    "role": {
      "id": 1,
      "name": "SuperAdmin",
      "description": "Full system access",
      "createdAt": "2026-06-23T08:35:30.000Z"
    },
    "createdAt": "2026-06-23T08:35:30.000Z",
    "updatedAt": "2026-06-23T08:35:30.000Z"
  }
]
```

**Response 401:**
```json
{
  "message": "No token provided",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### GET /api/users/:id

Auth: Required

**Path Params:** `id` (number)

**Response 200:**
```json
{
  "id": 1,
  "username": "superadmin",
  "email": "admin@southlake.com",
  "isActive": true,
  "isSuperAdmin": true,
  "roleId": 1,
  "role": {
    "id": 1,
    "name": "SuperAdmin",
    "description": "Full system access",
    "createdAt": "2026-06-23T08:35:30.000Z"
  },
  "createdAt": "2026-06-23T08:35:30.000Z",
  "updatedAt": "2026-06-23T08:35:30.000Z",
  "userEndpoints": [],
  "userModules": []
}
```

**Response 404:**
```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### POST /api/users

Auth: Required

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| username | string | Yes | @MinLength(3), @MaxLength(100) |
| email | string | Yes | @IsEmail() |
| password | string | Yes | @MinLength(6), @MaxLength(255) |
| roleId | number | No | @IsInt() |

**Example Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Pass@123",
  "roleId": 1
}
```

**Response 201:**
```json
{
  "id": 2,
  "username": "johndoe",
  "email": "john@example.com",
  "isActive": true,
  "isSuperAdmin": false,
  "roleId": 1,
  "role": {
    "id": 1,
    "name": "SuperAdmin",
    "description": "Full system access",
    "createdAt": "2026-06-23T08:35:30.000Z"
  },
  "createdAt": "2026-06-23T08:36:00.000Z",
  "updatedAt": "2026-06-23T08:36:00.000Z",
  "userEndpoints": [],
  "userModules": []
}
```

**Response 400:**
```json
{
  "message": ["email must be an email"],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Response 409:**
```json
{
  "message": "Email already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### PATCH /api/users/:id

Auth: Required

**Path Params:** `id` (number)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| username | string | No | @MinLength(3), @MaxLength(100) |
| email | string | No | @IsEmail() |
| password | string | No | @MinLength(6), @MaxLength(255) |
| roleId | number | No | @IsInt() |

**Example Request:**
```json
{
  "email": "johndoe@newdomain.com",
  "roleId": 2
}
```

**Response 200:**
```json
{
  "id": 2,
  "username": "johndoe",
  "email": "johndoe@newdomain.com",
  "isActive": true,
  "isSuperAdmin": false,
  "roleId": 2,
  "role": {
    "id": 2,
    "name": "Manager",
    "description": "Manager role",
    "createdAt": "2026-06-23T08:36:30.000Z"
  },
  "createdAt": "2026-06-23T08:36:00.000Z",
  "updatedAt": "2026-06-23T08:37:00.000Z",
  "userEndpoints": [],
  "userModules": []
}
```

**Response 404:**
```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### PATCH /api/users/:id/status

Auth: Required

**Path Params:** `id` (number)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| isActive | boolean | Yes | @IsBoolean() |

**Example Request:**
```json
{
  "isActive": false
}
```

**Response 200:**
```json
{
  "id": 2,
  "username": "johndoe",
  "email": "johndoe@newdomain.com",
  "isActive": false,
  "isSuperAdmin": false,
  "roleId": 2,
  "role": null,
  "createdAt": "2026-06-23T08:36:00.000Z",
  "updatedAt": "2026-06-23T08:38:00.000Z"
}
```

**Response 404:**
```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### POST /api/users/:id/endpoints

Auth: Required

Replaces all endpoint-level overrides for a user.

**Path Params:** `id` (number)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| endpointIds | number[] | Yes | @IsArray(), @ArrayNotEmpty(), @IsInt({ each: true }) |

**Example Request:**
```json
{
  "endpointIds": [1, 2, 3]
}
```

**Response 200:**
```json
{
  "id": 2,
  "username": "johndoe",
  "email": "john@example.com",
  "isActive": true,
  "isSuperAdmin": false,
  "roleId": null,
  "createdAt": "2026-06-23T08:36:00.000Z",
  "updatedAt": "2026-06-23T08:39:00.000Z",
  "userEndpoints": [
    { "id": 1, "userId": 2, "endpointId": 1 },
    { "id": 2, "userId": 2, "endpointId": 2 },
    { "id": 3, "userId": 2, "endpointId": 3 }
  ],
  "userModules": []
}
```

**Response 400:**
```json
{
  "message": ["endpointIds must not be empty"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### POST /api/users/:id/modules

Auth: Required

Replaces all module-level overrides for a user.

**Path Params:** `id` (number)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| moduleIds | number[] | Yes | @IsArray(), @ArrayNotEmpty(), @IsInt({ each: true }) |

**Example Request:**
```json
{
  "moduleIds": [1, 2]
}
```

**Response 200:**
```json
{
  "id": 2,
  "username": "johndoe",
  "email": "john@example.com",
  "isActive": true,
  "isSuperAdmin": false,
  "roleId": null,
  "createdAt": "2026-06-23T08:36:00.000Z",
  "updatedAt": "2026-06-23T08:40:00.000Z",
  "userEndpoints": [],
  "userModules": [
    { "id": 1, "userId": 2, "moduleId": 1 },
    { "id": 2, "userId": 2, "moduleId": 2 }
  ]
}
```

---

### GET /api/roles

Auth: Required

**Request:** None

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "SuperAdmin",
    "description": "Full system access",
    "createdAt": "2026-06-23T08:35:30.000Z"
  }
]
```

---

### GET /api/roles/:id

Auth: Required

**Path Params:** `id` (number)

**Response 200:**
```json
{
  "id": 1,
  "name": "SuperAdmin",
  "description": "Full system access",
  "createdAt": "2026-06-23T08:35:30.000Z",
  "roleEndpoints": [],
  "roleModules": [
    { "id": 1, "roleId": 1, "moduleId": 1 },
    { "id": 2, "roleId": 1, "moduleId": 2 },
    { "id": 3, "roleId": 1, "moduleId": 3 },
    { "id": 4, "roleId": 1, "moduleId": 4 },
    { "id": 5, "roleId": 1, "moduleId": 5 }
  ]
}
```

**Response 404:**
```json
{
  "message": "Role not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### POST /api/roles

Auth: Required

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | @MinLength(2), @MaxLength(100) |
| description | string | No | @IsString() |

**Example Request:**
```json
{
  "name": "Manager",
  "description": "Managerial access"
}
```

**Response 201:**
```json
{
  "id": 2,
  "name": "Manager",
  "description": "Managerial access",
  "createdAt": "2026-06-23T08:41:00.000Z"
}
```

**Response 409:**
```json
{
  "message": "Role name already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### PATCH /api/roles/:id

Auth: Required

**Path Params:** `id` (number)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | No | @MinLength(2), @MaxLength(100) |
| description | string | No | @IsString() |

**Example Request:**
```json
{
  "name": "Senior Manager"
}
```

**Response 200:**
```json
{
  "id": 2,
  "name": "Senior Manager",
  "description": "Managerial access",
  "createdAt": "2026-06-23T08:41:00.000Z",
  "updatedAt": "2026-06-23T08:42:00.000Z"
}
```

**Response 404:**
```json
{
  "message": "Role not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### DELETE /api/roles/:id

Auth: Required

**Path Params:** `id` (number)

**Request:** None

**Response 200:**
```json
{
  "id": 2,
  "name": "Senior Manager",
  "description": "Managerial access",
  "createdAt": "2026-06-23T08:41:00.000Z"
}
```

**Response 404:**
```json
{
  "message": "Role not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### POST /api/roles/:id/endpoints

Auth: Required

Replaces all endpoint-level permissions for a role.

**Path Params:** `id` (number)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| endpointIds | number[] | Yes | @IsArray(), @ArrayNotEmpty(), @IsInt({ each: true }) |

**Example Request:**
```json
{
  "endpointIds": [3, 4, 5]
}
```

**Response 200:**
```json
{
  "id": 2,
  "name": "Manager",
  "description": "Managerial access",
  "createdAt": "2026-06-23T08:41:00.000Z",
  "roleEndpoints": [
    { "id": 1, "roleId": 2, "endpointId": 3 },
    { "id": 2, "roleId": 2, "endpointId": 4 },
    { "id": 3, "roleId": 2, "endpointId": 5 }
  ],
  "roleModules": []
}
```

---

### POST /api/roles/:id/modules

Auth: Required

Replaces all module-level permissions for a role.

**Path Params:** `id` (number)

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| moduleIds | number[] | Yes | @IsArray(), @ArrayNotEmpty(), @IsInt({ each: true }) |

**Example Request:**
```json
{
  "moduleIds": [1, 2, 3]
}
```

**Response 200:**
```json
{
  "id": 2,
  "name": "Manager",
  "description": "Managerial access",
  "createdAt": "2026-06-23T08:41:00.000Z",
  "roleEndpoints": [],
  "roleModules": [
    { "id": 1, "roleId": 2, "moduleId": 1 },
    { "id": 2, "roleId": 2, "moduleId": 2 },
    { "id": 3, "roleId": 2, "moduleId": 3 }
  ]
}
```

---

### GET /api/modules

Auth: Required

**Request:** None

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Auth",
    "description": "Authentication and authorization",
    "createdAt": "2026-06-23T08:35:30.000Z"
  },
  {
    "id": 2,
    "name": "Users",
    "description": "User management",
    "createdAt": "2026-06-23T08:35:30.000Z"
  },
  {
    "id": 3,
    "name": "Roles",
    "description": "Role management",
    "createdAt": "2026-06-23T08:35:30.000Z"
  },
  {
    "id": 4,
    "name": "Modules",
    "description": "Module listing",
    "createdAt": "2026-06-23T08:35:30.000Z"
  },
  {
    "id": 5,
    "name": "Api Endpoints",
    "description": "API endpoint listing",
    "createdAt": "2026-06-23T08:35:30.000Z"
  }
]
```

---

### GET /api/api-endpoints

Auth: Required

**Request:** None

**Response 200:**
```json
[
  {
    "id": 1,
    "method": "POST",
    "path": "/api/auth/login",
    "name": "Login",
    "description": null,
    "moduleId": 1,
    "module": {
      "id": 1,
      "name": "Auth",
      "description": "Authentication and authorization",
      "createdAt": "2026-06-23T08:35:30.000Z"
    },
    "createdAt": "2026-06-23T08:35:30.000Z"
  },
  {
    "id": 2,
    "method": "GET",
    "path": "/api/auth/profile",
    "name": "Get Profile",
    "description": null,
    "moduleId": 1,
    "module": {
      "id": 1,
      "name": "Auth",
      "description": "Authentication and authorization",
      "createdAt": "2026-06-23T08:35:30.000Z"
    },
    "createdAt": "2026-06-23T08:35:30.000Z"
  }
]
```

---

### GET /api/api-endpoints/by-module/:id

Auth: Required

**Path Params:** `id` (number)

**Response 200:**
```json
[
  {
    "id": 1,
    "method": "POST",
    "path": "/api/auth/login",
    "name": "Login",
    "description": null,
    "moduleId": 1,
    "createdAt": "2026-06-23T08:35:30.000Z"
  },
  {
    "id": 2,
    "method": "GET",
    "path": "/api/auth/profile",
    "name": "Get Profile",
    "description": null,
    "moduleId": 1,
    "createdAt": "2026-06-23T08:35:30.000Z"
  }
]
```

---

## Entity Relationships

```
users (1) ──── (0..1) roles
                         │
modules (1) ──── (M) role_modules (M) ──── (1) roles
                         │
api_endpoints (1) ──── (M) role_endpoints (M) ──── (1) roles
                         │
modules (1) ──── (M) user_modules (M) ──── (1) users
                         │
api_endpoints (1) ──── (M) user_endpoints (M) ──── (1) users
```

- `roles.moduleId` → `role_modules` — module-level access via role
- `roles.endpointId` → `role_endpoints` — endpoint-level access via role
- `users.moduleId` → `user_modules` — module-level override per user
- `users.endpointId` → `user_endpoints` — endpoint-level override per user
- Users inherit permissions: role-based (module + endpoint) + user-based overrides (module + endpoint)
- Super admin bypasses all checks
