import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePermissions1700000000007 implements MigrationInterface {
  name = 'RenamePermissions1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const renameMap: Record<string, string> = {
      view: 'user_management.view',
      create: 'user_management.create',
      edit: 'user_management.edit',
      approve: 'user_management.approve',
      export: 'user_management.export',
      post: 'user_management.post',
      file: 'user_management.file',
      lock: 'user_management.lock',
      override: 'user_management.override',
      reconcile: 'user_management.reconcile',
      void: 'user_management.void',
      reverse: 'user_management.reverse',
    };

    for (const [oldAction, newAction] of Object.entries(renameMap)) {
      await queryRunner.query(
        `UPDATE "permissions" SET "action" = '${newAction}' WHERE "action" = '${oldAction}'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const reverseMap: Record<string, string> = {
      'user_management.view': 'view',
      'user_management.create': 'create',
      'user_management.edit': 'edit',
      'user_management.approve': 'approve',
      'user_management.export': 'export',
      'user_management.post': 'post',
      'user_management.file': 'file',
      'user_management.lock': 'lock',
      'user_management.override': 'override',
      'user_management.reconcile': 'reconcile',
      'user_management.void': 'void',
      'user_management.reverse': 'reverse',
    };

    for (const [oldAction, newAction] of Object.entries(reverseMap)) {
      await queryRunner.query(
        `UPDATE "permissions" SET "action" = '${newAction}' WHERE "action" = '${oldAction}'`,
      );
    }
  }
}
