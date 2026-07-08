import { QueryRunner } from 'typeorm';

export async function seedTreatyTypes(queryRunner: QueryRunner): Promise<void> {
  const treatyTypes = [
    { typeCode: 'QS', name: 'Quota Share', description: 'Quota Share' },
    { typeCode: 'FAC', name: 'Facultative', description: 'Facultative' },
  ];

  console.warn('Seeding Treaty Types...');
  for (const t of treatyTypes) {
    const exists = (await queryRunner.query(
      'SELECT id FROM treaty_type_master WHERE type_code = $1',
      [t.typeCode],
    )) as Array<{ id: string }>;

    if (exists.length === 0) {
      await queryRunner.query(
        `INSERT INTO treaty_type_master (type_code, name, description, is_active)
         VALUES ($1, $2, $3, true)`,
        [t.typeCode, t.name, t.description],
      );
    } else {
      await queryRunner.query(
        `UPDATE treaty_type_master SET name = $1, description = $2 WHERE type_code = $3`,
        [t.name, t.description, t.typeCode],
      );
    }
  }

  // Delete any other treaty types
  await queryRunner.query(
    `DELETE FROM treaty_type_master WHERE type_code NOT IN ('QS', 'FAC')`
  );
}
