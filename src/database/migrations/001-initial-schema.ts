import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000001 implements MigrationInterface {
  name = 'InitialSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "label" character varying NOT NULL,
        "color" character varying(7),
        "description" text,
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "role_id" uuid NOT NULL,
        "user_type" character varying NOT NULL,
        "user_entity_type" character varying,
        "user_entity_id" uuid,
        "name" character varying NOT NULL,
        "initials" character varying(4),
        "avatar_color" character varying(7),
        "phone" character varying,
        "department" character varying,
        "title" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "joined_date" date,
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "deleted_by" uuid,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_role_id"
        FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      CREATE TABLE "modules" (
        "id" character varying NOT NULL,
        "label" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_modules" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "modules"
        ADD CONSTRAINT "FK_modules_created_by"
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "modules"
        ADD CONSTRAINT "FK_modules_updated_by"
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "submodules" (
        "id" character varying NOT NULL,
        "module_id" character varying NOT NULL,
        "label" character varying NOT NULL,
        CONSTRAINT "PK_submodules" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "submodules"
        ADD CONSTRAINT "FK_submodules_module_id"
        FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "action" character varying NOT NULL,
        "label" character varying NOT NULL,
        "description" character varying,
        CONSTRAINT "UQ_permissions_action" UNIQUE ("action"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "role_id" uuid NOT NULL,
        "module_id" character varying NOT NULL,
        "submodule_id" character varying,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "UQ_role_permissions" UNIQUE ("role_id", "module_id", "submodule_id", "permission_id"),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
        ADD CONSTRAINT "FK_role_permissions_role_id"
        FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
        ADD CONSTRAINT "FK_role_permissions_module_id"
        FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
        ADD CONSTRAINT "FK_role_permissions_submodule_id"
        FOREIGN KEY ("submodule_id") REFERENCES "submodules"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
        ADD CONSTRAINT "FK_role_permissions_permission_id"
        FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "user_permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "module_id" character varying NOT NULL,
        "submodule_id" character varying,
        "permission_id" uuid NOT NULL,
        "access_type" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        CONSTRAINT "PK_user_permissions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user_permissions"
        ADD CONSTRAINT "FK_user_permissions_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_permissions"
        ADD CONSTRAINT "FK_user_permissions_module_id"
        FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_permissions"
        ADD CONSTRAINT "FK_user_permissions_submodule_id"
        FOREIGN KEY ("submodule_id") REFERENCES "submodules"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_permissions"
        ADD CONSTRAINT "FK_user_permissions_permission_id"
        FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "login_otps" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "otp_hash" character varying NOT NULL,
        "attempt_count" integer NOT NULL DEFAULT 0,
        "is_used" boolean NOT NULL DEFAULT false,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_login_otps" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "session_token" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "device_label" character varying,
        "ip_address" character varying,
        "user_agent" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        "revoked_at" TIMESTAMP,
        "revoke_reason" character varying,
        CONSTRAINT "UQ_user_sessions_token" UNIQUE ("session_token"),
        CONSTRAINT "PK_user_sessions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user_sessions"
        ADD CONSTRAINT "FK_user_sessions_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "login_challenges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "challenge_token" character varying NOT NULL,
        "existing_session_id" uuid,
        "new_device_label" character varying,
        "new_ip_address" character varying,
        "new_user_agent" character varying,
        "status" character varying NOT NULL DEFAULT 'pending',
        "expires_at" TIMESTAMP NOT NULL,
        "resolved_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_login_challenges_token" UNIQUE ("challenge_token"),
        CONSTRAINT "PK_login_challenges" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "login_challenges"
        ADD CONSTRAINT "FK_login_challenges_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "login_challenges"
        ADD CONSTRAINT "FK_login_challenges_existing_session_id"
        FOREIGN KEY ("existing_session_id") REFERENCES "user_sessions"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "pending_invites" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "role_id" uuid,
        "user_entity_type" character varying,
        "user_entity_id" uuid,
        "invited_by" uuid,
        "invited_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        "token" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        CONSTRAINT "UQ_pending_invites_token" UNIQUE ("token"),
        CONSTRAINT "PK_pending_invites" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "pending_invites"
        ADD CONSTRAINT "FK_pending_invites_role_id"
        FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "pending_invites"
        ADD CONSTRAINT "FK_pending_invites_invited_by"
        FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "activity_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "module_id" character varying,
        "submodule_id" character varying,
        "action" character varying NOT NULL,
        "entity_type" character varying,
        "entity_id" uuid,
        "description" text,
        "ip_address" character varying,
        "user_agent" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "activity_logs"
        ADD CONSTRAINT "FK_activity_logs_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "activity_logs"
        ADD CONSTRAINT "FK_activity_logs_module_id"
        FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "activity_logs"
        ADD CONSTRAINT "FK_activity_logs_submodule_id"
        FOREIGN KEY ("submodule_id") REFERENCES "submodules"("id") ON DELETE SET NULL
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_login_otps_email" ON "login_otps" ("email")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_login_otps_expires_at" ON "login_otps" ("expires_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_sessions_user_id" ON "user_sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_sessions_is_active" ON "user_sessions" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_user_id" ON "activity_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_created_at" ON "activity_logs" ("created_at")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role_id" ON "users" ("role_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_is_deleted" ON "users" ("is_deleted")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pending_invites" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "login_challenges" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "login_otps" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "submodules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "modules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
  }
}
