import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGlMappingMaster1782457475545 implements MigrationInterface {
    name = 'CreateGlMappingMaster1782457475545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create table
        await queryRunner.query(`CREATE TABLE "gl_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coa_id" uuid NOT NULL, "type" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_e0acd1a4ac49af4dc7e82ca358f" UNIQUE ("type"), CONSTRAINT "PK_880af11599a977b299cedba86aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "gl_mappings" ADD CONSTRAINT "FK_0eb6769f0bb0799ffe4704222d2" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

        // Seed 4 child GL Accounts under parent Root COAs
        const assetsParent = await queryRunner.query(`SELECT "id" FROM "chart_of_accounts" WHERE "account_code" = 110000`);
        const liabilityParent = await queryRunner.query(`SELECT "id" FROM "chart_of_accounts" WHERE "account_code" = 210000`);
        const revenueParent = await queryRunner.query(`SELECT "id" FROM "chart_of_accounts" WHERE "account_code" = 410000`);
        const expenseParent = await queryRunner.query(`SELECT "id" FROM "chart_of_accounts" WHERE "account_code" = 510000`);

        if (assetsParent.length > 0 && liabilityParent.length > 0 && revenueParent.length > 0 && expenseParent.length > 0) {
            await queryRunner.query(`
                INSERT INTO "chart_of_accounts" ("account_code", "description", "parent_id", "normal_balance", "is_parent", "is_active")
                VALUES
                    (110001, 'ACCOUNT RECEIVABLE', '${assetsParent[0].id}', 'debit', false, true),
                    (210001, 'ACCOUNT PAYABLE', '${liabilityParent[0].id}', 'credit', false, true),
                    (410001, 'MGA COMMISSION INCOME', '${revenueParent[0].id}', 'credit', false, true),
                    (510001, 'BROKER COMMISSION EXPENSE', '${expenseParent[0].id}', 'debit', false, true)
                ON CONFLICT ("account_code") DO NOTHING
            `);
        }

        // Fetch the newly added GL Account IDs
        const arAccount = await queryRunner.query(`SELECT "id" FROM "chart_of_accounts" WHERE "account_code" = 110001`);
        const apAccount = await queryRunner.query(`SELECT "id" FROM "chart_of_accounts" WHERE "account_code" = 210001`);
        const mgaAccount = await queryRunner.query(`SELECT "id" FROM "chart_of_accounts" WHERE "account_code" = 410001`);
        const brkAccount = await queryRunner.query(`SELECT "id" FROM "chart_of_accounts" WHERE "account_code" = 510001`);

        if (arAccount.length > 0 && apAccount.length > 0 && mgaAccount.length > 0 && brkAccount.length > 0) {
            // Seed GL Mappings
            await queryRunner.query(`
                INSERT INTO "gl_mappings" ("coa_id", "type")
                VALUES
                    ('${arAccount[0].id}', 'AR'),
                    ('${apAccount[0].id}', 'AP'),
                    ('${mgaAccount[0].id}', 'MGA'),
                    ('${brkAccount[0].id}', 'BRK')
                ON CONFLICT ("type") DO NOTHING
            `);
        }

        // Seed admin_tool module permissions
        await queryRunner.query(`
            INSERT INTO "modules" ("id", "label")
            VALUES ('admin_tool', 'Admin Tool')
            ON CONFLICT ("id") DO NOTHING
        `);

        const superadminRole = await queryRunner.query(`SELECT "id" FROM "roles" WHERE "name" = 'superadmin'`);
        const adminRole = await queryRunner.query(`SELECT "id" FROM "roles" WHERE "name" = 'admin'`);

        if (superadminRole.length > 0 && adminRole.length > 0) {
            const superadminId = superadminRole[0].id;
            const adminId = adminRole[0].id;
            const allPermissions = await queryRunner.query(`SELECT "id", "action" FROM "permissions"`);

            for (const perm of allPermissions) {
                await queryRunner.query(`
                    INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
                    VALUES ('${superadminId}', 'admin_tool', '${perm.id}')
                    ON CONFLICT DO NOTHING
                `);
            }

            const adminPerms = allPermissions.filter((p: any) =>
                ['view', 'create', 'edit', 'approve', 'export'].includes(p.action)
            );
            for (const perm of adminPerms) {
                await queryRunner.query(`
                    INSERT INTO "role_permissions" ("role_id", "module_id", "permission_id")
                    VALUES ('${adminId}', 'admin_tool', '${perm.id}')
                    ON CONFLICT DO NOTHING
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback permissions
        await queryRunner.query(`DELETE FROM "role_permissions" WHERE "module_id" = 'admin_tool'`);
        await queryRunner.query(`DELETE FROM "modules" WHERE "id" = 'admin_tool'`);

        // Rollback GL Mappings
        await queryRunner.query(`ALTER TABLE "gl_mappings" DROP CONSTRAINT "FK_0eb6769f0bb0799ffe4704222d2"`);
        await queryRunner.query(`DROP TABLE "gl_mappings"`);

        // Rollback COA seeds
        await queryRunner.query(`DELETE FROM "chart_of_accounts" WHERE "account_code" IN (110001, 210001, 410001, 510001)`);
    }

}
