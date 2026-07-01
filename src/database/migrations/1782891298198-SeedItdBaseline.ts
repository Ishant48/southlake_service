import { MigrationInterface, QueryRunner } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

export class SeedItdBaseline1782891298198 implements MigrationInterface {
  name = 'SeedItdBaseline1782891298198';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const programsConfig = [
      {
        program: 'DPR APD',
        mga: '2002',
        lob: '000212',
        lineDescSuffix: 'FUT Starlight T2 APD DRP',
        cc: '00',
        rates: {
          qs: 100,
          cf: 5,
          comm: 29.0,
          bb: 0.40,
          ulae: 7.0,
          xol: 2.0,
          lr: 2.0,
          lossPick: 61.1,
          laeDcc: 0.0,
          laeAoe: 3.4,
          boardsCharge: 0.40,
          lossRatioCap: 2.0
        }
      },
      {
        program: 'APD (Local)',
        mga: '1202',
        lob: '000212',
        lineDescSuffix: 'FUT Starlight T2 APD Local',
        cc: '000',
        rates: {
          qs: 100,
          cf: 5,
          comm: 29.0,
          bb: 0.40,
          ulae: 7.0,
          xol: 2.0,
          lr: 2.0,
          lossPick: 61.1,
          laeDcc: 0.0,
          laeAoe: 3.4,
          boardsCharge: 0.40,
          lossRatioCap: 2.0
        }
      }
    ];

    for (const config of programsConfig) {
      // Check/insert treaties
      const treatyRows = await queryRunner.query(
        `SELECT "id" FROM "treaties" WHERE "name" = $1`,
        [config.program]
      );

      if (!treatyRows || treatyRows.length === 0) {
        const treatyCode = config.program.toUpperCase().replace(/\s+/g, '_');
        await queryRunner.query(
          `INSERT INTO "treaties" ("treaty_code", "name", "qs_pct", "cf_pct", "comm_pct", "bb_pct", "ulae_pct", "xol_pct", "lr_cap_pct", "ibnr_pct", "is_active")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
          [
            treatyCode,
            config.program,
            config.rates.qs,
            config.rates.cf,
            config.rates.comm,
            config.rates.bb,
            config.rates.ulae,
            config.rates.xol,
            config.rates.lr,
            config.rates.lossPick
          ]
        );
      }

      // Delete existing ITD workbooks
      const existingItdRows = await queryRunner.query(
        `SELECT "id" FROM "workbooks" WHERE "program" = $1 AND "source" = 'ITD'`,
        [config.program]
      );
      for (const row of existingItdRows) {
        await queryRunner.query(`DELETE FROM "state_exhibits" WHERE "workbookId" = $1`, [row.id]);
        await queryRunner.query(`DELETE FROM "workbooks" WHERE "id" = $1`, [row.id]);
      }

      // Insert ITD workbook
      const insertWbRes = await queryRunner.query(
        `INSERT INTO "workbooks" ("program", "monthKey", "monthLabel", "source", "rates", "mga", "lob", "lineDescSuffix", "cc", "comp", "ext", "sub", "status")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING "id"`,
        [
          config.program,
          '2025-12',
          'December 2025',
          'ITD',
          JSON.stringify(config.rates),
          config.mga,
          config.lob,
          config.lineDescSuffix,
          config.cc,
          '100',
          '0000',
          '',
          'Draft'
        ]
      );

      const workbookId = insertWbRes[0].id;

      // Seed state exhibits
      const statesDir = path.join(__dirname, '../seeds/states');
      if (fs.existsSync(statesDir)) {
        const files = fs.readdirSync(statesDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
          const filePath = path.join(statesDir, file);
          const exJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          const safeNumArr = (field: string): string => {
            const val = exJson[field];
            if (Array.isArray(val) && val.length === 3) {
              const cleaned = val.map(v => Number(v) || 0);
              return `{${cleaned.join(',')}}`;
            }
            return '{0,0,0}';
          };

          await queryRunner.query(
            `INSERT INTO "state_exhibits" (
              "workbookId", "stateCode", "pw", "pfw", "pc", "pfc", "tax", "lp", "laep", "ae_paid",
              "pe", "pfe", "uep", "lu", "laeu", "aeu", "loss_reserves", "lae_reserves_dcc",
              "lae_reserves_aoe", "loss_ibnr", "lae_ibnr_dcc", "lae_ibnr_aoe", "ulae_ibnr"
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
            [
              workbookId,
              exJson.stateCode.toUpperCase(),
              safeNumArr('pw'),
              safeNumArr('pfw'),
              safeNumArr('pc'),
              safeNumArr('pfc'),
              safeNumArr('tax'),
              safeNumArr('lp'),
              safeNumArr('laep'),
              safeNumArr('ae_paid'),
              safeNumArr('pe'),
              safeNumArr('pfe'),
              safeNumArr('uep'),
              safeNumArr('lu'),
              safeNumArr('laeu'),
              safeNumArr('aeu'),
              safeNumArr('loss_reserves'),
              safeNumArr('lae_reserves_dcc'),
              safeNumArr('lae_reserves_aoe'),
              safeNumArr('loss_ibnr'),
              safeNumArr('lae_ibnr_dcc'),
              safeNumArr('lae_ibnr_aoe'),
              safeNumArr('ulae_ibnr')
            ]
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const programs = ['DPR APD', 'APD (Local)'];
    for (const program of programs) {
      const existingItdRows = await queryRunner.query(
        `SELECT "id" FROM "workbooks" WHERE "program" = $1 AND "source" = 'ITD'`,
        [program]
      );
      for (const row of existingItdRows) {
        await queryRunner.query(`DELETE FROM "state_exhibits" WHERE "workbookId" = $1`, [row.id]);
        await queryRunner.query(`DELETE FROM "workbooks" WHERE "id" = $1`, [row.id]);
      }
    }
  }
}
