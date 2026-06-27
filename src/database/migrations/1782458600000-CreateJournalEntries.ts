import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJournalEntries1782458600000 implements MigrationInterface {
    name = 'CreateJournalEntries1782458600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create journal_entry_batches table
        await queryRunner.query(`
            CREATE TABLE "journal_entry_batches" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "batch_number" character varying NOT NULL,
                "period" character varying NOT NULL,
                "agent_name" character varying NOT NULL,
                "total_amount" numeric(15,2) NOT NULL DEFAULT 0.00,
                "count" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" uuid,
                "updated_at" TIMESTAMP DEFAULT now(),
                "updated_by" uuid,
                CONSTRAINT "UQ_batch_number" UNIQUE ("batch_number"),
                CONSTRAINT "PK_journal_entry_batches" PRIMARY KEY ("id")
            )
        `);

        // 2. Create journal_entries table
        await queryRunner.query(`
            CREATE TABLE "journal_entries" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "batch_id" uuid NOT NULL,
                "je_number" integer NOT NULL,
                "description" character varying NOT NULL,
                "coa_id" uuid NOT NULL,
                "sub" character varying,
                "debit" numeric(15,2),
                "credit" numeric(15,2),
                "date" date NOT NULL,
                "dp" character varying,
                "policy" character varying,
                "memo" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now(),
                CONSTRAINT "PK_journal_entries" PRIMARY KEY ("id"),
                CONSTRAINT "FK_journal_entries_batch" FOREIGN KEY ("batch_id") REFERENCES "journal_entry_batches" ("id") ON DELETE CASCADE,
                CONSTRAINT "FK_journal_entries_coa" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts" ("id") ON DELETE RESTRICT
            )
        `);

        // 3. Seed journal_entry module permissions
        await queryRunner.query(`
            INSERT INTO "modules" ("id", "label")
            VALUES ('journal_entry', 'Journal Entries')
            ON CONFLICT ("id") DO NOTHING
        `);

        const superadminRole = await queryRunner.query(`SELECT "id" FROM "roles" WHERE "name" = 'superadmin'`);
        const adminRole = await queryRunner.query(`SELECT "id" FROM "roles" WHERE "name" = 'admin'`);

        if (superadminRole.length > 0 && adminRole.length > 0) {
            const superadminId = superadminRole[0].id;
            const adminId = adminRole[0].id;
            const allPermissions = await queryRunner.query(`SELECT "id", "action" FROM "permissions"`);

            // Seed all permissions for superadmin role
            for (const perm of allPermissions) {
                await queryRunner.query(`
                    INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
                    VALUES ('${superadminId}', 'journal_entry', '${perm.id}')
                    ON CONFLICT DO NOTHING
                `);
            }

            // Seed common permissions for admin role
            const adminPerms = allPermissions.filter((p: any) =>
                ['view', 'create', 'edit', 'approve', 'export', 'post'].includes(p.action)
            );
            for (const perm of adminPerms) {
                await queryRunner.query(`
                    INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
                    VALUES ('${adminId}', 'journal_entry', '${perm.id}')
                    ON CONFLICT DO NOTHING
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback permissions
        await queryRunner.query(`DELETE FROM "role_permissions" WHERE "module_id" = 'journal_entry'`);
        await queryRunner.query(`DELETE FROM "modules" WHERE "id" = 'journal_entry'`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "journal_entries"`);
        await queryRunner.query(`DROP TABLE "journal_entry_batches"`);
    }
}
