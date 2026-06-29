import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkbookTables1782632963796 implements MigrationInterface {
    name = 'CreateWorkbookTables1782632963796'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journal_entries" DROP CONSTRAINT "FK_journal_entries_batch"`);
        await queryRunner.query(`ALTER TABLE "journal_entries" DROP CONSTRAINT "FK_journal_entries_coa"`);
        await queryRunner.query(`CREATE TABLE "state_exhibits" ("id" SERIAL NOT NULL, "workbookId" integer NOT NULL, "stateCode" character varying NOT NULL, "pw" numeric array NOT NULL DEFAULT '{0,0,0}', "pfw" numeric array NOT NULL DEFAULT '{0,0,0}', "pc" numeric array NOT NULL DEFAULT '{0,0,0}', "pfc" numeric array NOT NULL DEFAULT '{0,0,0}', "tax" numeric array NOT NULL DEFAULT '{0,0,0}', "lp" numeric array NOT NULL DEFAULT '{0,0,0}', "laep" numeric array NOT NULL DEFAULT '{0,0,0}', "ae_paid" numeric array NOT NULL DEFAULT '{0,0,0}', "pe" numeric array NOT NULL DEFAULT '{0,0,0}', "pfe" numeric array NOT NULL DEFAULT '{0,0,0}', "uep" numeric array NOT NULL DEFAULT '{0,0,0}', "lu" numeric array NOT NULL DEFAULT '{0,0,0}', "laeu" numeric array NOT NULL DEFAULT '{0,0,0}', "aeu" numeric array NOT NULL DEFAULT '{0,0,0}', "loss_reserves" numeric array NOT NULL DEFAULT '{0,0,0}', "lae_reserves_dcc" numeric array NOT NULL DEFAULT '{0,0,0}', "lae_reserves_aoe" numeric array NOT NULL DEFAULT '{0,0,0}', "loss_ibnr" numeric array NOT NULL DEFAULT '{0,0,0}', "lae_ibnr_dcc" numeric array NOT NULL DEFAULT '{0,0,0}', "lae_ibnr_aoe" numeric array NOT NULL DEFAULT '{0,0,0}', "ulae_ibnr" numeric array NOT NULL DEFAULT '{0,0,0}', CONSTRAINT "PK_787577d99d3cc3c4fd8c4aff41a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cash_settlements" ("id" SERIAL NOT NULL, "workbookId" integer NOT NULL, "begBal" numeric(15,2) NOT NULL DEFAULT '0', "amtPaid" numeric(15,2) NOT NULL DEFAULT '0', CONSTRAINT "REL_9d1e38ce8b1df37c28147e8969" UNIQUE ("workbookId"), CONSTRAINT "PK_cee5a5ba5d8f2f9488aa5743cbc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workbooks" ("id" SERIAL NOT NULL, "program" character varying NOT NULL, "monthKey" character varying NOT NULL, "monthLabel" character varying NOT NULL, "source" character varying NOT NULL DEFAULT 'FUT', "rates" jsonb, "mga" character varying NOT NULL DEFAULT '1201', "lob" character varying NOT NULL DEFAULT '000171', "lineDescSuffix" character varying NOT NULL DEFAULT '', "comp" character varying NOT NULL DEFAULT '100', "cc" character varying NOT NULL DEFAULT '000', "ext" character varying NOT NULL DEFAULT '0000', "sub" character varying NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_984f720e2c516b1e34a2f2705b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "journal_entry_batches" ALTER COLUMN "total_amount" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "state_exhibits" ADD CONSTRAINT "FK_1cbdddc932e472bfacf5eb59b8b" FOREIGN KEY ("workbookId") REFERENCES "workbooks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cash_settlements" ADD CONSTRAINT "FK_9d1e38ce8b1df37c28147e8969a" FOREIGN KEY ("workbookId") REFERENCES "workbooks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_5e5d46369ee0b9de3a24c23bb97" FOREIGN KEY ("batch_id") REFERENCES "journal_entry_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_c23b37139aba44dd3730e7c88cf" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journal_entries" DROP CONSTRAINT "FK_c23b37139aba44dd3730e7c88cf"`);
        await queryRunner.query(`ALTER TABLE "journal_entries" DROP CONSTRAINT "FK_5e5d46369ee0b9de3a24c23bb97"`);
        await queryRunner.query(`ALTER TABLE "cash_settlements" DROP CONSTRAINT "FK_9d1e38ce8b1df37c28147e8969a"`);
        await queryRunner.query(`ALTER TABLE "state_exhibits" DROP CONSTRAINT "FK_1cbdddc932e472bfacf5eb59b8b"`);
        await queryRunner.query(`ALTER TABLE "journal_entry_batches" ALTER COLUMN "total_amount" SET DEFAULT 0.00`);
        await queryRunner.query(`DROP TABLE "workbooks"`);
        await queryRunner.query(`DROP TABLE "cash_settlements"`);
        await queryRunner.query(`DROP TABLE "state_exhibits"`);
        await queryRunner.query(`ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_journal_entries_coa" FOREIGN KEY ("coa_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_journal_entries_batch" FOREIGN KEY ("batch_id") REFERENCES "journal_entry_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
