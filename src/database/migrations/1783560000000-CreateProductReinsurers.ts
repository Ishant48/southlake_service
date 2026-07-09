import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductReinsurers1783560000000 implements MigrationInterface {
  name = 'CreateProductReinsurers1783560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_reinsurers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "reinsurer_id" uuid NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" uuid, CONSTRAINT "UQ_product_reinsurers_product_id_reinsurer_id" UNIQUE ("product_id", "reinsurer_id"), CONSTRAINT "PK_product_reinsurers_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_product_reinsurers_product_id" ON "product_reinsurers" ("product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_reinsurers_reinsurer_id" ON "product_reinsurers" ("reinsurer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_reinsurers_is_deleted" ON "product_reinsurers" ("is_deleted")`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_reinsurers" ADD CONSTRAINT "FK_product_reinsurers_product_id" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_reinsurers" ADD CONSTRAINT "FK_product_reinsurers_reinsurer_id" FOREIGN KEY ("reinsurer_id") REFERENCES "reinsurer_companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_reinsurers" DROP CONSTRAINT "FK_product_reinsurers_reinsurer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_reinsurers" DROP CONSTRAINT "FK_product_reinsurers_product_id"`,
    );

    await queryRunner.query(`DROP INDEX "IDX_product_reinsurers_is_deleted"`);
    await queryRunner.query(`DROP INDEX "IDX_product_reinsurers_reinsurer_id"`);
    await queryRunner.query(`DROP INDEX "IDX_product_reinsurers_product_id"`);

    await queryRunner.query(`DROP TABLE "product_reinsurers"`);
  }
}
