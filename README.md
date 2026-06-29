# Southlake Service — NestJS Backend API

The backend REST API for the **Southlake Insurance** platform, built with **NestJS 11**, **TypeORM**, and **PostgreSQL**. Handles authentication (email + OTP), user management, role-based permissions, chart of accounts, master data, and activity logging.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup on a New Device](#setup-on-a-new-device)
  - [Step 1 — Install Node.js](#step-1--install-nodejs)
  - [Step 2 — Configure PostgreSQL](#step-2--configure-postgresql)
  - [Step 3 — Install Dependencies](#step-3--install-dependencies)
  - [Step 4 — Create the Environment File](#step-4--create-the-environment-file)
  - [Step 5 — Run Database Migrations](#step-5--run-database-migrations)
  - [Step 6 — Seed Chart of Accounts](#step-6--seed-chart-of-accounts)
  - [Step 7 — Start the Server](#step-7--start-the-server)
- [Environment Variables Reference](#environment-variables-reference)
- [Database Management](#database-management)
- [Available Scripts](#available-scripts)
- [Modules Overview](#modules-overview)
- [API Overview](#api-overview)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer        | Technology                        | Version    |
|--------------|-----------------------------------|------------|
| Framework    | NestJS                            | ^11.0.0    |
| Language     | TypeScript                        | >= 5.6     |
| Runtime      | Node.js                           | >= 24.0.0  |
| Database     | PostgreSQL                        | >= 14      |
| ORM          | TypeORM                           | ^0.3.20    |
| Auth         | JWT (JSON Web Tokens) + OTP Email | —          |
| Email        | Nodemailer (SMTP / Gmail)         | ^6.9.16    |
| Validation   | class-validator + class-transformer | —        |
| Security     | Helmet, bcryptjs                  | —          |
| Docs         | Swagger / OpenAPI                 | ^11.0.0    |

---

## Project Structure

```
southlake_service/
├── src/
│   ├── main.ts                        Application entry point (Swagger, CORS, Helmet)
│   ├── app.module.ts                  Root module
│   │
│   ├── config/                        Configuration files
│   │
│   ├── common/                        Shared decorators, guards, pipes
│   │
│   ├── entities/                      TypeORM entity definitions
│   │   ├── user.entity.ts
│   │   ├── role.entity.ts
│   │   ├── permission.entity.ts
│   │   ├── user-session.entity.ts
│   │   ├── module-group.entity.ts
│   │   └── ...
│   │
│   ├── database/
│   │   ├── data-source.ts             TypeORM DataSource (used by CLI and migrations)
│   │   ├── migrations/                All TypeORM migration files
│   │   └── seed-coa.ts                Chart of Accounts seeder script
│   │
│   └── modules/
│       ├── auth/                      Login, OTP, invite acceptance, /auth/me
│       ├── users/                     User CRUD + invite flow
│       ├── roles/                     Role CRUD + permission assignment
│       ├── permissions/               Permission read/update per user
│       ├── chart-of-accounts/         COA hierarchy + account types
│       ├── masters/                   Master data management
│       ├── mail/                      Nodemailer email service
│       └── activity-logs/             Audit trail for all actions
│
├── .env                               Your local environment config (never commit!)
├── .env.example                       Template — copy this to create .env
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## Prerequisites

| Tool           | Version   | Download / Install                                                 |
|----------------|-----------|--------------------------------------------------------------------|
| Node.js        | >= 24.0.0 | https://nodejs.org                                                 |
| NVM (optional) | Latest    | https://github.com/coreybutler/nvm-windows/releases                |
| PostgreSQL     | >= 14     | https://www.postgresql.org/download/                               |
| NestJS CLI     | >= 11.0.0 | `npm install -g @nestjs/cli`                                       |
| Git            | Latest    | https://git-scm.com/downloads                                      |

> **Tip:** Use **NVM for Windows** to manage Node.js versions and easily switch between them.

---

## Setup on a New Device

Follow every step in order.

---

### Step 1 — Install Node.js

**Using NVM (recommended):**

```bash
nvm install 24
nvm use 24

# Verify
node --version    # v24.x.x
npm --version
```

**Without NVM:** Download and install Node.js 24 from https://nodejs.org.

---

### Step 2 — Configure PostgreSQL

1. Install PostgreSQL >= 14 from https://www.postgresql.org/download/
2. During setup, note the password you set for the `postgres` user.
3. Open **pgAdmin** or the **psql** terminal and create the database:

```sql
CREATE DATABASE southlake;
```

> You can use a different database name — just make sure it matches `DATABASE_NAME` in your `.env`.

---

### Step 3 — Install Dependencies

```bash
cd southlake_service
npm install
```

---

### Step 4 — Create the Environment File

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**Windows CMD:**
```cmd
copy .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Open `.env` and fill in all values. See the [Environment Variables Reference](#environment-variables-reference) section below for a description of each field.

```env
# ── Database ─────────────────────────────────────────────────────────
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=southlake
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password

# ── JWT ──────────────────────────────────────────────────────────────
JWT_SECRET=replace_with_a_long_random_secret_at_least_64_chars

# ── Email (SMTP / Gmail) ─────────────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_gmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM="Southlake Insurance <noreply@southlake.com>"

# ── Application ──────────────────────────────────────────────────────
APP_URL=http://localhost:4200
PORT=3000

# ── Security ─────────────────────────────────────────────────────────
SESSION_EXPIRY_HOURS=24
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
```

**How to generate a Gmail App Password:**

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required).
3. Under 2-Step Verification, open **App passwords**.
4. Create a new app password for **Mail**.
5. Copy the 16-character password into `MAIL_PASSWORD`.

> **Never use your regular Gmail password here.** App Passwords are separate credentials.

---

### Step 5 — Run Database Migrations

This creates all required tables in PostgreSQL:

```bash
npm run migration:run
```

---

### Step 6 — Seed Chart of Accounts

Populate the initial Chart of Accounts data (recommended for first setup):

```bash
npm run seed:coa
```

---

### Step 7 — Start the Server

**Development mode** — auto-restarts on file changes:

```bash
npm run start:dev
```

**Production mode** — compile first, then run the output:

```bash
npm run build
npm run start:prod
```

| Resource              | URL                           |
|-----------------------|-------------------------------|
| API Base URL          | http://localhost:3000         |
| Swagger Documentation | http://localhost:3000/api     |

---

## Environment Variables Reference

| Variable               | Description                                            | Example                                |
|------------------------|--------------------------------------------------------|----------------------------------------|
| `DATABASE_HOST`        | PostgreSQL server hostname                             | `localhost`                            |
| `DATABASE_PORT`        | PostgreSQL server port                                 | `5432`                                 |
| `DATABASE_NAME`        | Name of the database to connect to                     | `southlake`                            |
| `DATABASE_USER`        | PostgreSQL username                                    | `postgres`                             |
| `DATABASE_PASSWORD`    | PostgreSQL password                                    | `yourpassword`                         |
| `JWT_SECRET`           | Secret key used to sign and verify JWT tokens          | `a_very_long_random_secret_string`     |
| `MAIL_HOST`            | SMTP server hostname                                   | `smtp.gmail.com`                       |
| `MAIL_PORT`            | SMTP server port                                       | `587`                                  |
| `MAIL_USER`            | SMTP username / sender email address                   | `you@gmail.com`                        |
| `MAIL_PASSWORD`        | SMTP password or Gmail App Password                    | `abcd efgh ijkl mnop`                  |
| `MAIL_FROM`            | Display name and address shown in outgoing emails      | `"Southlake <noreply@southlake.com>"`  |
| `APP_URL`              | Frontend base URL — used to build links in emails      | `http://localhost:4200`                |
| `PORT`                 | Port the NestJS server listens on                      | `3000`                                 |
| `SESSION_EXPIRY_HOURS` | How long a user session stays active                   | `24`                                   |
| `OTP_EXPIRY_MINUTES`   | How long an OTP code remains valid                     | `5`                                    |
| `OTP_MAX_ATTEMPTS`     | Maximum wrong OTP attempts before the code is locked   | `5`                                    |

---

## Database Management

The project uses **TypeORM migrations** for all schema changes. Never edit the database schema directly.

### Apply all pending migrations

```bash
npm run migration:run
```

### Revert the last applied migration

```bash
npm run migration:revert
```

### Generate a new migration (after modifying an entity)

```bash
npm run migration:generate -- --name=DescriptiveMigrationName
```

### Seed Chart of Accounts data

```bash
npm run seed:coa
```

---

## DB Structure & RBAC Permissions Schema

The database schema manages roles, flat permission rules, and granular user overrides in a modular way:

```
+---------------+         +------------------+         +-----------------+
|     roles     | <------ | role_permissions | ------> |   permissions   |
+---------------+         +------------------+         +-----------------+
        ^                                                       ^
        |                                                       |
        |                                                       |
+---------------+         +------------------+                  |
|     users     | <------ | user_permissions | -----------------+
+---------------+         +------------------+
```

### 1. Key Tables
* **`roles`**: Defines the user roles (e.g. `superadmin`, `admin`, `underwriter`).
* **`permissions`**: Flat database-driven permission strings mapped to resource actions (e.g. `chart_of_accounts.view`, `user.create`, `activity_log.export`).
* **`role_permissions`**: Links roles to specific permissions.
* **`user_permissions`**: Granular overrides mapping specific users to permission ids with an `access_type`:
  * `grant`: Explicitly grants access to a permission not included in their role.
  * `revoke`: Explicitly revokes access to a permission that would normally be granted by their role.

### 2. Resolving Effective Permissions
When verifying a user's permissions, the system queries the role-level grants first, then overlays user overrides (applying any `revoke` overrides to delete matching permissions, and adding any `grant` overrides to the set). Super Admin users bypass this check and unconditionally receive full access.

---

---

## Available Scripts

| Script                       | Description                                         |
|------------------------------|-----------------------------------------------------|
| `npm run build`              | Compile TypeScript to JavaScript (`dist/`)          |
| `npm run start`              | Start the server (no watch)                         |
| `npm run start:dev`          | Start with hot-reload (development)                 |
| `npm run start:prod`         | Run the compiled production build from `dist/`      |
| `npm run migration:run`      | Apply all pending database migrations               |
| `npm run migration:revert`   | Roll back the most recent migration                 |
| `npm run migration:generate` | Auto-generate a migration from entity changes       |
| `npm run migration:create`   | Create a blank migration file                       |
| `npm run seed:coa`           | Seed Chart of Accounts data into the database       |
| `npm run seed:permissions`   | Seed flat module permissions and roles associations |
| `npm run lint`               | Run ESLint (zero warnings policy)                   |
| `npm run lint:fix`           | Auto-fix all fixable ESLint violations              |
| `npm run format`             | Auto-format all TypeScript files with Prettier      |
| `npm run format:check`       | Check formatting without writing changes            |
| `npm run test`               | Run all unit tests with Jest                        |
| `npm run test:watch`         | Run tests in watch mode                             |
| `npm run test:cov`           | Run tests and generate a coverage report            |

---

## Modules Overview

| Module              | Description                                                                   |
|---------------------|-------------------------------------------------------------------------------|
| `auth`              | Login initiation, OTP verification, session conflict resolution, invite acceptance, `/auth/me` |
| `users`             | User CRUD, invite flow, permission overrides per user                        |
| `roles`             | Role creation/update/delete, permission matrix per role                      |
| `permissions`       | Read and update module-level permissions                                     |
| `chart-of-accounts` | Full COA hierarchy — account groups, types, sub-types, and leaf accounts     |
| `masters`           | Master data management (e.g., categories, references)                        |
| `mail`              | Centralized Nodemailer email service (OTP emails, invite links)               |
| `activity-logs`     | Audit trail — records every significant user action with IP and timestamp    |

---

## API Overview

Full interactive Swagger documentation is available at **http://localhost:3000/api** when the server is running.

### Key Endpoints

| Method | Endpoint                      | Auth | Description                                 |
|--------|-------------------------------|:----:|---------------------------------------------|
| POST   | `/auth/login`                 | No   | Initiate login — sends OTP to email         |
| POST   | `/auth/verify-otp`            | No   | Submit OTP, receive session or challenge token |
| POST   | `/auth/resolve-challenge`     | No   | Resolve a session conflict challenge        |
| GET    | `/auth/me`                    | Yes  | Get current user profile + permissions      |
| POST   | `/auth/logout`                | Yes  | Invalidate current session                  |
| GET    | `/auth/invite-details/:token` | No   | Get invite info by token                    |
| POST   | `/auth/accept-invite`         | No   | Accept invite and set password              |
| GET    | `/users`                      | Yes  | List all users                              |
| POST   | `/users/invite`               | Yes  | Invite a new user by email                  |
| PATCH  | `/users/:id`                  | Yes  | Update user details                         |
| GET    | `/roles`                      | Yes  | List all roles                              |
| POST   | `/roles`                      | Yes  | Create a new role                           |
| PUT    | `/roles/:id/permissions`      | Yes  | Update permissions for a role               |
| GET    | `/chart-of-accounts`          | Yes  | Retrieve COA tree                           |
| GET    | `/masters`                    | Yes  | Retrieve master data                        |
| GET    | `/activity-logs`              | Yes  | List activity log entries                   |

> All authenticated endpoints require the header: `Authorization: Bearer <token>`

---

## Security Notes

- **Never commit `.env`** — it is in `.gitignore`. Every developer and server environment needs its own copy.
- Use a **strong `JWT_SECRET`** — at minimum 64 random characters. Use a password generator.
- Use **Gmail App Passwords**, never your actual Google account password.
- In production, update `APP_URL` to your real domain (e.g., `https://app.southlake.com`).
- Review and tighten the CORS configuration in `src/main.ts` before deploying to production.
- Enable HTTPS in production via a reverse proxy (e.g., Nginx, Caddy).

---

## Troubleshooting

### Database connection error

**Symptoms:** `ECONNREFUSED 127.0.0.1:5432` or `password authentication failed`

**Fix:**
1. On Windows, open **Services** and confirm the PostgreSQL service is running.
2. Verify all `DATABASE_*` values in your `.env`.
3. Make sure the database exists — run `\l` in psql or check pgAdmin.

---

### Migration fails

**Symptoms:** `relation already exists`, `column does not exist`, or `QueryFailedError`

**Fix:**
```bash
# Revert the last migration and re-apply
npm run migration:revert
npm run migration:run
```

If the schema is badly out of sync, drop and recreate the database:

```sql
DROP DATABASE southlake;
CREATE DATABASE southlake;
```

Then re-run migrations:

```bash
npm run migration:run
npm run seed:coa
```

---

### Emails not sending

**Symptoms:** `Invalid login`, `EAUTH`, or SMTP timeout in logs

**Fix:**
1. Confirm you are using a **Gmail App Password**, not your account password.
2. Make sure **2-Step Verification** is enabled before generating an App Password.
3. Verify `MAIL_HOST=smtp.gmail.com` and `MAIL_PORT=587`.
4. Generate a fresh App Password and update `.env`.

---

### npm install fails

```bash
npm cache clean --force
npm install
```

Verify Node.js version:

```bash
node --version   # Must be v24.x.x or higher
```

---

### Multiple Carrier & Reinsurer Splits (Added June 2026)
The platform now supports assigning multiple **Carrier (Risk) Companies** (with custom retention percentages) and multiple **Reinsurer Companies** (with custom cession percentages) per Treaty.
* Dynamic lists are persisted relational-wise inside `treaty_carriers` and `treaty_reinsurers` tables.
* Single column fields on `treaties` table act as automatic fallbacks/bridges to maintain backward compatibility.

---

*Last updated: June 2026*
