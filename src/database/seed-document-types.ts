import { QueryRunner } from 'typeorm';

export async function seedDocumentTypes(queryRunner: QueryRunner): Promise<void> {
  const documentTypes = [
    { name: 'User Manuals', code: 'User Manuals' },
    { name: 'SRM LICENSING', code: 'SRM LICENSE' },
    { name: 'Policy Submissions', code: 'Policy Submissions' },
    { name: 'Policy SLA Info', code: 'Policy SLA Info' },
    { name: 'Policy Reports - Monthly/Quarterly etc.', code: 'Policy Reports - Monthly/Quarterly etc.' },
    { name: 'Policy Reinstatements', code: 'Policy Reinstatements' },
    { name: 'Policy Physical Damage Log', code: 'Policy Physical Damage Log' },
    { name: 'Policy Loss Runs', code: 'Policy Loss Runs' },
    { name: 'Policy Inspections', code: 'Policy Inspections' },
    { name: 'Policy General', code: 'Policy General' },
    { name: 'Policy Follow Up', code: 'Policy Follow Up' },
    { name: 'Policy Filings', code: 'Policy Filings' },
    { name: 'Policy Endorsements - Trailers', code: 'Policy Endorsements - Trailers' },
    { name: 'Policy Endorsements - Second Named Insured', code: 'Policy Endorsements - Second Named Insured' },
  ];

  console.warn('Seeding Document Types...');
  for (const doc of documentTypes) {
    const exists = (await queryRunner.query(
      'SELECT id FROM document_type_master WHERE code = $1',
      [doc.code],
    )) as Array<{ id: string }>;

    if (exists.length === 0) {
      await queryRunner.query(
        `INSERT INTO document_type_master (code, name, description, is_active)
         VALUES ($1, $2, $2, true)`,
        [doc.code, doc.name],
      );
    } else {
      await queryRunner.query(
        `UPDATE document_type_master SET name = $1, description = $1 WHERE code = $2`,
        [doc.name, doc.code],
      );
    }
  }
}
