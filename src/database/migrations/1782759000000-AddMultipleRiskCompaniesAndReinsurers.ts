import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMultipleRiskCompaniesAndReinsurers1782759000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create treaty_carriers table
    await queryRunner.query(`
      CREATE TABLE "treaty_carriers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "risk_company_id" uuid NOT NULL,
        "retention_pct" decimal(6,2) NOT NULL,
        CONSTRAINT "PK_treaty_carriers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_treaty_carriers_treaty" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_treaty_carriers_risk_company" FOREIGN KEY ("risk_company_id") REFERENCES "risk_companies"("id") ON DELETE RESTRICT
      )
    `);

    // 2. Create treaty_reinsurers table
    await queryRunner.query(`
      CREATE TABLE "treaty_reinsurers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "treaty_id" uuid NOT NULL,
        "reinsurer_id" uuid NOT NULL,
        "cession_pct" decimal(6,2) NOT NULL,
        CONSTRAINT "PK_treaty_reinsurers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_treaty_reinsurers_treaty" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_treaty_reinsurers_reinsurer" FOREIGN KEY ("reinsurer_id") REFERENCES "reinsurer_companies"("id") ON DELETE RESTRICT
      )
    `);

    // 3. Migrate existing data from treaties table
    const existingTreaties = await queryRunner.query(`
      SELECT id, risk_company_id, carrier_retention_pct, reinsurer_id, reinsurer_cession_pct FROM treaties
    `);

    for (const treaty of existingTreaties) {
      if (treaty.risk_company_id && treaty.carrier_retention_pct !== null) {
        await queryRunner.query(`
          INSERT INTO treaty_carriers (treaty_id, risk_company_id, retention_pct)
          VALUES ($1, $2, $3)
        `, [treaty.id, treaty.risk_company_id, treaty.carrier_retention_pct]);
      }
      if (treaty.reinsurer_id && treaty.reinsurer_cession_pct !== null) {
        await queryRunner.query(`
          INSERT INTO treaty_reinsurers (treaty_id, reinsurer_id, cession_pct)
          VALUES ($1, $2, $3)
        `, [treaty.id, treaty.reinsurer_id, treaty.reinsurer_cession_pct]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "treaty_reinsurers"`);
    await queryRunner.query(`DROP TABLE "treaty_carriers"`);
  }
}
