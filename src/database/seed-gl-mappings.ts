import { QueryRunner } from 'typeorm';

async function ensureCoa(
  queryRunner: QueryRunner,
  code: number,
  description: string,
  parentId: string,
  normalBalance: string,
): Promise<string> {
  const exists = (await queryRunner.query(
    'SELECT id FROM chart_of_accounts WHERE account_code = $1',
    [code],
  )) as Array<{ id: string }>;
  
  if (exists.length > 0) {
    return exists[0].id;
  }

  const result = (await queryRunner.query(
    `INSERT INTO chart_of_accounts (account_code, description, parent_id, normal_balance, is_parent, is_active)
     VALUES ($1, $2, $3, $4, false, true)
     RETURNING id`,
    [code, description, parentId, normalBalance],
  )) as Array<{ id: string }>;

  return result[0].id;
}

export async function seedGlMappings(queryRunner: QueryRunner): Promise<void> {
  const mappings = [
    {
      type: 'AR',
      code: 110001,
      desc: 'ACCOUNT RECEIVABLE',
      parentId: 'eba64f9d-7005-4f26-8261-abb497632b99',
      balance: 'debit',
    },
    {
      type: 'AP',
      code: 210001,
      desc: 'ACCOUNT PAYABLE',
      parentId: '508a065f-d3f8-44f3-bd65-3863afe968ac',
      balance: 'credit',
    },
    {
      type: 'MGA',
      code: 410001,
      desc: 'MGA COMMISSION INCOME',
      parentId: 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25',
      balance: 'credit',
    },
    {
      type: 'BRK',
      code: 510001,
      desc: 'BROKER COMMISSION EXPENSE',
      parentId: 'd27d17a3-1219-419f-9e0a-a83e227db55a',
      balance: 'debit',
    },
  ];

  for (const item of mappings) {
    const coaId = await ensureCoa(queryRunner, item.code, item.desc, item.parentId, item.balance);
    const mappingExists = (await queryRunner.query(
      'SELECT id FROM gl_mappings WHERE type = $1',
      [item.type],
    )) as Array<{ id: string }>;

    if (mappingExists.length === 0) {
      await queryRunner.query(
        `INSERT INTO gl_mappings (coa_id, type) VALUES ($1, $2)`,
        [coaId, item.type],
      );
    } else {
      await queryRunner.query(
        `UPDATE gl_mappings SET coa_id = $1 WHERE type = $2`,
        [coaId, item.type],
      );
    }
  }
}
