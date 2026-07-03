import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSequencePrefixCounters1783300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sequence_prefix_counters" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "prefix" character varying,
        "next_value" integer NOT NULL DEFAULT 1,
        "padding_width" integer NOT NULL DEFAULT 4,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "PK_sequence_prefix_counters" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sequence_prefix_counters_code" UNIQUE ("code")
      )
    `);

    // Seed some default sequences
    const defaultSequences = [
      { code: 'POLICY_SEQ', name: 'Policy Number Sequence', prefix: 'POL', next: 1001, width: 5, desc: 'Sequence generator for policy numbers' },
      { code: 'CLAIM_SEQ', name: 'Claim Number Sequence', prefix: 'CLM', next: 5001, width: 5, desc: 'Sequence generator for claim numbers' },
      { code: 'MGA_SEQ', name: 'MGA ID Sequence', prefix: 'MGA', next: 101, width: 3, desc: 'Sequence generator for MGA identifiers' },
      { code: 'TREATY_SEQ', name: 'Treaty Code Sequence', prefix: 'TRT', next: 101, width: 3, desc: 'Sequence generator for treaty code numbers' }
    ];

    for (const seq of defaultSequences) {
      await queryRunner.query(
        `INSERT INTO sequence_prefix_counters (code, name, prefix, next_value, padding_width, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [seq.code, seq.name, seq.prefix, seq.next, seq.width, seq.desc]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sequence_prefix_counters"`);
  }
}
