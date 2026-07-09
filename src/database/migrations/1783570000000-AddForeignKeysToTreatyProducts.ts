import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeysToTreatyProducts1783570000000 implements MigrationInterface {
  name = 'AddForeignKeysToTreatyProducts1783570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "treaty_products" ADD CONSTRAINT "FK_treaty_products_treaty_id" FOREIGN KEY ("treaty_id") REFERENCES "treaties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_products" ADD CONSTRAINT "FK_treaty_products_product_id" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "treaty_products" DROP CONSTRAINT "FK_treaty_products_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "treaty_products" DROP CONSTRAINT "FK_treaty_products_treaty_id"`,
    );
  }
}
