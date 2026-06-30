import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEntitiesSchema1782797690877 implements MigrationInterface {
    name = 'SyncEntitiesSchema1782797690877'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treaty_carriers" DROP CONSTRAINT "FK_treaty_carriers_treaty"`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" DROP CONSTRAINT "FK_treaty_carriers_risk_company"`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_treaty_reinsurers_treaty"`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_treaty_reinsurers_reinsurer"`);
        await queryRunner.query(`ALTER TABLE "workbooks" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" ADD CONSTRAINT "FK_ac4a9648be2489de038d54ddd0b" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" ADD CONSTRAINT "FK_7942a4317391f2f7347755e96bc" FOREIGN KEY ("risk_company_id") REFERENCES "risk_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_45d0b4ac835a933c29e2cf54692" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_89cc1d82dbab33eb68c7f395040" FOREIGN KEY ("reinsurer_id") REFERENCES "reinsurer_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_89cc1d82dbab33eb68c7f395040"`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" DROP CONSTRAINT "FK_45d0b4ac835a933c29e2cf54692"`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" DROP CONSTRAINT "FK_7942a4317391f2f7347755e96bc"`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" DROP CONSTRAINT "FK_ac4a9648be2489de038d54ddd0b"`);
        await queryRunner.query(`ALTER TABLE "workbooks" ALTER COLUMN "status" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_treaty_reinsurers_reinsurer" FOREIGN KEY ("reinsurer_id") REFERENCES "reinsurer_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_reinsurers" ADD CONSTRAINT "FK_treaty_reinsurers_treaty" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" ADD CONSTRAINT "FK_treaty_carriers_risk_company" FOREIGN KEY ("risk_company_id") REFERENCES "risk_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treaty_carriers" ADD CONSTRAINT "FK_treaty_carriers_treaty" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
