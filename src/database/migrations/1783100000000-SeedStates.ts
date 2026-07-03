import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedStates1783100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const states = [
      { code: 1, abbr: 'AL', name: 'Alabama' },
      { code: 2, abbr: 'AK', name: 'Alaska' },
      { code: 3, abbr: 'AZ', name: 'Arizona' },
      { code: 4, abbr: 'AR', name: 'Arkansas' },
      { code: 5, abbr: 'CA', name: 'California' },
      { code: 6, abbr: 'CO', name: 'Colorado' },
      { code: 7, abbr: 'CT', name: 'Connecticut' },
      { code: 8, abbr: 'DE', name: 'Delaware' },
      { code: 9, abbr: 'DC', name: 'District of Columbia' },
      { code: 10, abbr: 'FL', name: 'Florida' },
      { code: 11, abbr: 'GA', name: 'Georgia' },
      { code: 12, abbr: 'HI', name: 'Hawaii' },
      { code: 13, abbr: 'ID', name: 'Idaho' },
      { code: 14, abbr: 'IL', name: 'Illinois' },
      { code: 15, abbr: 'IN', name: 'Indiana' },
      { code: 16, abbr: 'IA', name: 'Iowa' },
      { code: 17, abbr: 'KS', name: 'Kansas' },
      { code: 18, abbr: 'KY', name: 'Kentucky' },
      { code: 19, abbr: 'LA', name: 'Louisiana' },
      { code: 20, abbr: 'ME', name: 'Maine' },
      { code: 21, abbr: 'MD', name: 'Maryland' },
      { code: 22, abbr: 'MA', name: 'Massachusetts' },
      { code: 23, abbr: 'MI', name: 'Michigan' },
      { code: 24, abbr: 'MN', name: 'Minnesota' },
      { code: 25, abbr: 'MS', name: 'Mississippi' },
      { code: 26, abbr: 'MO', name: 'Missouri' },
      { code: 27, abbr: 'MT', name: 'Montana' },
      { code: 28, abbr: 'NE', name: 'Nebraska' },
      { code: 29, abbr: 'NV', name: 'Nevada' },
      { code: 30, abbr: 'NH', name: 'New Hampshire' },
      { code: 31, abbr: 'NJ', name: 'New Jersey' },
      { code: 32, abbr: 'NM', name: 'New Mexico' },
      { code: 33, abbr: 'NY', name: 'New York' },
      { code: 34, abbr: 'NC', name: 'North Carolina' },
      { code: 35, abbr: 'ND', name: 'North Dakota' },
      { code: 36, abbr: 'OH', name: 'Ohio' },
      { code: 37, abbr: 'OK', name: 'Oklahoma' },
      { code: 38, abbr: 'OR', name: 'Oregon' },
      { code: 39, abbr: 'PA', name: 'Pennsylvania' },
      { code: 40, abbr: 'PR', name: 'Puerto Rico' },
      { code: 41, abbr: 'RI', name: 'Rhode Island' },
      { code: 42, abbr: 'SC', name: 'South Carolina' },
      { code: 43, abbr: 'SD', name: 'South Dakota' },
      { code: 44, abbr: 'TN', name: 'Tennessee' },
      { code: 45, abbr: 'TX', name: 'Texas' },
      { code: 46, abbr: 'UT', name: 'Utah' },
      { code: 47, abbr: 'VT', name: 'Vermont' },
      { code: 48, abbr: 'VA', name: 'Virginia' },
      { code: 49, abbr: 'WA', name: 'Washington' },
      { code: 50, abbr: 'WV', name: 'West Virginia' },
      { code: 51, abbr: 'WI', name: 'Wisconsin' },
      { code: 52, abbr: 'WY', name: 'Wyoming' }
    ];

    // 1. Temporarily clear/offset existing state codes to avoid unique constraint violations
    await queryRunner.query(`UPDATE state_master SET state_code = state_code + 1000 WHERE state_code IS NOT NULL`);

    // 2. Insert or update the 52 states
    for (const state of states) {
      await queryRunner.query(
        `INSERT INTO state_master (state_code, state_abbr, name, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (state_abbr)
         DO UPDATE SET state_code = EXCLUDED.state_code, name = EXCLUDED.name`,
        [state.code, state.abbr, state.name]
      );
    }

    // 3. Delete any orphaned states that were not updated (state_code > 1000)
    await queryRunner.query(`DELETE FROM state_master WHERE state_code > 1000`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM state_master WHERE state_code BETWEEN 1 AND 52`);
  }
}
