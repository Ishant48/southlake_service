import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRiskCompanyMgaToProductMaster1783550000000 implements MigrationInterface {
  name = 'AddRiskCompanyMgaToProductMaster1783550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_master" ADD "risk_company_id" uuid`);
    await queryRunner.query(`ALTER TABLE "product_master" ADD "mga_id" uuid`);

    await queryRunner.query(
      `CREATE INDEX "IDX_product_master_risk_company_id" ON "product_master" ("risk_company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_master_mga_id" ON "product_master" ("mga_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_master" ADD CONSTRAINT "FK_product_master_risk_company_id" FOREIGN KEY ("risk_company_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_master" ADD CONSTRAINT "FK_product_master_mga_id" FOREIGN KEY ("mga_id") REFERENCES "mga_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`CREATE SEQUENCE product_master_product_id_seq;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE product_master_product_id_seq;`);

    await queryRunner.query(
      `ALTER TABLE "product_master" DROP CONSTRAINT "FK_product_master_mga_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_master" DROP CONSTRAINT "FK_product_master_risk_company_id"`,
    );

    await queryRunner.query(`DROP INDEX "IDX_product_master_mga_id"`);
    await queryRunner.query(`DROP INDEX "IDX_product_master_risk_company_id"`);

    await queryRunner.query(`ALTER TABLE "product_master" DROP COLUMN "mga_id"`);
    await queryRunner.query(`ALTER TABLE "product_master" DROP COLUMN "risk_company_id"`);
  }
}
