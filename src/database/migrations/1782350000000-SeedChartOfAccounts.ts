import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedChartOfAccounts1782350000000 implements MigrationInterface {
  name = 'SeedChartOfAccounts1782350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Seeding chart of accounts...');
    
    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "is_parent", "normal_balance", "next_number")
      VALUES ('eba64f9d-7005-4f26-8261-abb497632b99', 110000, 'ASSETS', 'Assets', NULL, true, 'debit', 170101)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "is_parent", "normal_balance", "next_number")
      VALUES ('508a065f-d3f8-44f3-bd65-3863afe968ac', 210000, 'LIABILITY', 'Liability', NULL, true, 'credit', 290101)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "is_parent", "normal_balance", "next_number")
      VALUES ('eb839704-dcf5-45f6-8da4-9e4142f8a652', 310000, 'CAPITAL_AND_EQUITY', 'Capital and Equity', NULL, true, 'credit', 390001)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "is_parent", "normal_balance", "next_number")
      VALUES ('edf606f7-d7bc-483a-93a4-4fe2e4d55a25', 410000, 'REVENUE', 'Revenue', NULL, true, 'credit', 490101)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "is_parent", "normal_balance", "next_number")
      VALUES ('d27d17a3-1219-419f-9e0a-a83e227db55a', 510000, 'EXPANSE', 'Expense', NULL, true, 'debit', 930201)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('cb103921-87e9-493e-bafb-411469fe6e1e', 100010, 'US_GOVT_BONDS', 'US Govt Bonds', 'Original GL Code: 100-100010-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('11e1e617-9606-4f1f-b30e-dcbd6fe7f513', 100110, 'OTHER_BONDS', 'Other Bonds', 'Original GL Code: 120-100110-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d434796a-7c09-4d27-b277-f59448203357', 100910, 'BONDS_MARK_TO_MARKET', 'Bonds - Mark to market', 'Original GL Code: 100-100910-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('153db8b9-184e-4dc2-8ef9-67f2f5cf1eb4', 100920, 'BONDS_FX', 'Bonds - FX', 'Original GL Code: 100-100920-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('752a8217-fc5b-4e44-9edc-02385beb4547', 101010, 'UNAFILIATED_PREFERRED_STOCKS', 'Unafiliated Preferred Stocks', 'Original GL Code: 100-101010-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('104491c4-5659-45b6-9741-148ff8b00ffc', 101910, 'UNAFFIL_PREFERRED_STOCKS_MARK_TO_MARKET', 'Unaffil Preferred Stocks - Mark to market', 'Original GL Code: 100-101910-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('1930d628-0317-4f1c-8954-636170db05cd', 102010, 'UNAFFILIATED_COMMON_STOCKS', 'Unaffiliated Common Stocks', 'Original GL Code: 100-102010-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('04ce5714-da59-4f8f-b4be-b5052279d2ec', 102110, 'AFFILIATED_COMMON_STOCKS', 'Affiliated Common Stocks', 'Original GL Code: 100-102110-000-0000-000000-00-0000. Subledgers count: 2.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('6b3c348c-45db-4d6d-be6d-2ecbea58ce8a', 102210, 'AFFILIATED_COMMON_STOCKS_GOODWILL', 'Affiliated Common Stocks - Goodwill', 'Original GL Code: 100-102210-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('4a0eaa6e-dcec-4012-8a3f-ff61ae55a211', 102910, 'UNAFFIL_COMMON_STOCK_MARK_TO_MARKET', 'Unaffil Common Stock - Mark to market', 'Original GL Code: 100-102910-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8a7f7866-b09b-4056-968a-1d63eeb60332', 102920, 'AFFIL_COMMON_STOCK_MARK_TO_MARKET', 'Affil Common Stock - Mark to market', 'Original GL Code: 100-102920-000-0000-000000-00-0000. Subledgers count: 2.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('c5421598-43ff-4ca0-9967-0e6e18ecb945', 103010, 'MORTGAGE_LOANS', 'Mortgage Loans', 'Original GL Code: 100-103010-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('108d2f22-511d-4ab6-bb2c-2f94aea6bb11', 106010, 'OPERATING_ACCOUNT_SSIC_7656', 'Operating account - SSIC 7656', 'Original GL Code: 100-106010-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('5fcf5495-f318-41de-a983-767bc5dad7f8', 106020, 'MORGAN_STANLEY_SSIC_5112', 'Morgan Stanley - SSIC 5112', 'Original GL Code: 100-106020-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8cf8e69f-3e62-4533-86ab-a286efdeb2af', 106030, 'MORGAN_STANLEY_SSIC_5113', 'Morgan Stanley - SSIC 5113', 'Original GL Code: 100-106030-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('b725a3f7-70b5-4a30-9fdd-1da8b7d6bd5d', 106031, 'MORGAN_STANLEY_MARKET_VALUE_ADJ', 'Morgan Stanley Market Value Adj', 'Original GL Code: 100-106031-000-0000-000000-00-0000. Subledgers count: 2.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('cc5d00fb-db1e-4de4-b8cd-fff38e176ee5', 106040, 'MORGAN_STANLEY_SSIC_2274', 'Morgan Stanley - SSIC 2274', 'Original GL Code: 100-106040-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('4254fea1-7525-4002-8942-0bac9e3e95d7', 106050, 'MORGAN_STANLEY_SSIC_5521', 'Morgan Stanley - SSIC 5521', 'Original GL Code: 100-106050-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('c610af2f-00ca-429e-ac82-b4cffa4b545b', 106060, 'MORGAN_STANLEY_SSIC_4196', 'Morgan Stanley - SSIC 4196', 'Original GL Code: 100-106060-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f4be640b-18e7-4d06-be72-f65105348121', 106070, 'MORGAN_STANLEY_SSIC_9749', 'Morgan Stanley - SSIC 9749', 'Original GL Code: 100-106070-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('421840e3-e843-4293-a271-6a370e0b5767', 106080, 'MORGAN_STANLEY_SSIC_9748', 'Morgan Stanley - SSIC 9748', 'Original GL Code: 100-106080-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('7cf1fb4b-0578-4444-9292-0014a4009714', 106110, 'OPERATING_ACCOUNT_SFH_8240', 'Operating Account - SFH 8240', 'Original GL Code: 200-106110-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('eaf1ffa5-0e91-49e6-b16d-d56ba8a759ab', 106120, 'BOA_OPER_ACCOUNT_SFH_8359', 'BOA Oper account - SFH 8359', 'Original GL Code: 100-106120-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('7845fd2a-e40d-41cf-a316-b4cecd8833c0', 106310, 'OPERATING_ACCOUNT_WSIC_4588', 'Operating account - WSIC 4588', 'Original GL Code: 110-106310-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2befe257-1198-4bcf-a102-05657f4b94a4', 106320, 'MORGAN_STANLEY_WSIC_5114', 'Morgan Stanley - WSIC 5114', 'Original GL Code: 100-106320-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('6d1c7cee-0a84-4d1b-b46e-7c6e32caa5be', 106330, 'MORGAN_STANLEY_WSIC_9753', 'Morgan Stanley - WSIC 9753', 'Original GL Code: 110-106330-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('4980c9df-4528-4535-8ec7-5635d298148e', 106410, 'MORGAN_STANLEY_NGIC_4437', 'Morgan Stanley - NGIC 4437', 'Original GL Code: 120-106410-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d6f313c0-ed4c-40c8-841d-7a8543dbb98b', 106420, 'MORGAN_STANLEY_NGIC_9751', 'Morgan Stanley - NGIC 9751', 'Original GL Code: 120-106420-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('1c95c036-6b5c-4f8e-9a91-a55dd8bed3c6', 106510, 'CUSTODIAL_CASH_US_BANK_5000149_000', 'Custodial cash - US Bank 5000149-000', 'Original GL Code: 110-106510-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('720daa6f-368f-4a18-a7b1-980d58ae713e', 106530, 'CUSTODIAL_CASH_US_BANK_5000833_000', 'Custodial cash - US Bank - 5000833-000', 'Original GL Code: 110-106530-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a8ec38a3-d55d-48cb-b2a1-e65c91cdc6d6', 106531, 'CUSTODIAL_CASH_US_BANK_5001867_000', 'Custodial Cash - US Bank - 5001867-000', 'Original GL Code: 110-106531-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('c22feeb5-bd1a-47a2-892d-9a20d69cd3b5', 106532, 'CUSTODIAL_CASH_US_BANK_5001923_000', 'Custodial Cash  - US Bank - 5001923-000', 'Original GL Code: 110-106532-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('08563aaa-87aa-414b-87b7-a87859290a2c', 106533, 'CUSTODIAL_CASH_US_BANK_5002010_000', 'Custodial Cash - US Bank - 5002010-000', 'Original GL Code: 110-106533-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('fa01a3b4-eb65-46d6-bb50-8043674ec2a8', 106534, 'CUSTODIAL_CASH_US_BANK_517543', 'Custodial Cash - US Bank - 517543', 'Original GL Code: 120-106534-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('0f2aa22a-5151-41f8-823a-d228f38a4330', 106535, 'CUSTODIAL_CASH_US_BANK_5003099_000', 'Custodial cash - US Bank - 5003099-000', 'Original GL Code: 120-106535-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('08427b38-759d-46eb-a553-2cd2c0665658', 106536, 'CUSTODIAL_CASH_US_BANK_5003144_000', 'Custodial cash - US Bank - 5003144-000', 'Original GL Code: 120-106536-0
0-0000-000000-00-0000. Subledgers count: 2.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a8f28f8d-b6e3-4ede-960b-54b1e23898ad', 106537, 'CUSTODIAL_CASH_US_BANK_OSTID9410', 'Custodial Cash - US Bank - OSTID9410', 'Original GL Code: 100-106537-000-0000-000000-00-0000. Subledgers count: 2.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('986e239f-cfdb-41d9-aeca-e20ae97aea7f', 106538, 'CUSTODIAL_CASH_US_BANK_078286600', 'Custodial cash - US Bank - 078286600', 'Original GL Code: 120-106538-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('c00cd6a3-016f-4d26-842c-6f9036064dda', 106560, 'CUSTODIAL_CASH_TEXAS_TRUST_SSIC_4996', 'Custodial cash - Texas Trust SSIC 4996', 'Original GL Code: 100-106560-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('28604fb4-b607-4590-964f-0921a396ee5a', 106570, 'CUSTODIAL_CASH_TEXAS_TRUST_WSIC_4997', 'Custodial cash - Texas Trust WSIC 4997', 'Original GL Code: 110-106570-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('4a1f2407-9520-43d7-b37f-cf9ef790a3c6', 106580, 'CUSTODIAL_CASH_CENTURY_TRUST_4848', 'Custodial cash - Century Trust 4848', 'Original GL Code: 100-106580-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2655d4ff-13c8-49e2-829e-8c8899ce759f', 106581, 'CUSTODIAL_CASH_CENTURY_TRUST_53159', 'Custodial cash - Century Trust 53159', 'Original GL Code: 110-106581-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('5ec9222b-ba4a-4649-805d-e5bec656ea71', 106582, 'CUSTODIAL_CASH_PRINCIPAL_2300', 'Custodial cash - Principal 2300', 'Original GL Code: 120-106582-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8d45f344-6c53-497d-9dfd-27f7d3470ad1', 106610, 'CASH_EQUIVALENTS', 'Cash Equivalents', 'Original GL Code: 100-106610-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('53e3f181-2e17-49e9-95f1-b6e6bc475377', 106680, 'CASH_EQUIVALENTS_MARK_TO_MARKET', 'Cash Equivalents - Mark to market', 'Original GL Code: 100-106680-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('ca88d4bf-5a9a-495b-84e2-05bd331bc07d', 106710, 'SHORT_TERM', 'Short Term', 'Original GL Code: 100-106710-000-0000-000000-00-0000. Subledgers count: 2.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('e3a3fe87-c2e1-466e-89b4-5991222fcd05', 108010, 'OTHER_INVESTED_ASSETS', 'Other Invested Assets', 'Original GL Code: 100-108010-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f6b8e572-4727-4f7d-8bb4-c2e20a8db4c6', 109100, 'RECEIVABLE_FOR_SECURITIES', 'Receivable for securities', 'Original GL Code: 120-109100-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('3d27a8e3-9947-477e-a67c-d0252c416829', 110010, 'US_GOVT_BONDS_ACCRUED_INV_INC', 'US Govt Bonds Accrued Inv Inc', 'Original GL Code: 100-110010-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('773cf54a-2d9c-4cc6-9446-dace43ba0a43', 110020, 'OTHER_BONDS_ACCRUED_INV_INC', 'Other Bonds Accrued Inv Inc', 'Original GL Code: 120-110020-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('93e1b2e2-aed8-453e-905d-283f8d553c81', 110630, 'CASH_EQUIVALENT_ACCRD_INV_INC', 'Cash equivalent Accrd Inv Inc', 'Original GL Code: 100-110630-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('7ec2a5f9-f7a6-4c03-b171-5ace68854fbc', 110650, 'SHORT_TERM_ACCRD_INV_INC', 'Short term Accrd Inv Inc', 'Original GL Code: 100-110650-000-0000-000000-00-0000. Subledgers count: 2.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('3db53ad6-f967-468c-9a93-1c857aa12cca', 110810, 'OTHER_INVESTED_ASSETS_ACCRD_INV_INC', 'Other Invested Assets Accrd Inv Inc', 'Original GL Code: 100-110810-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('90d1898b-bb6b-4193-9ce6-77c009238e6c', 120100, 'UNCOLLECTED_PREM_DIRECT', 'Uncollected Prem Direct', 'Original GL Code: 100-120100-0
0-1101-000027-00-0000. Subledgers count: 92.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('6d73d613-d884-4828-986a-67d4e1904063', 120200, 'UNCOLLECTED_PREM_ASSUMED', 'Uncollected Prem Assumed', 'Original GL Code: 100-120200-000-1501-000191-00-0000. Subledgers count: 94.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('559af3e3-7783-42a6-af9d-38e3b9af41a4', 120400, 'UNCOLLECTED_PREM_NON_ADMITTED', 'Uncollected Prem Non-admitted', 'Original GL Code: 100-120400-000-0101-000194-00-0000. Subledgers count: 4.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a577c344-5d71-422e-a840-26dfd02526b0', 121100, 'DEFERRED_PREMIUM_DIRECT', 'Deferred Premium Direct', 'Original GL Code: 110-121100-000-0000-000000-00-0000. Subledgers count: 12.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f76dbc3b-0ff3-4b4a-b7f5-b7671940b5b1', 125100, 'AMOUNTS_RECOVERABLE_FROM_REINSURERS', 'Amounts recoverable from reinsurers', 'Original GL Code: 100-125100-000-0000-000000-00-0000. Subledgers count: 88.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f6d09cd4-77ef-4ccf-ad34-5e10efa0e919', 127100, 'OTHER_AMOUNTS_RECOVERABLE_FROM_REINSURERS', 'Other amounts recoverable from reinsurers', 'Original GL Code: 100-127100-0
0-1101-000027-00-0000. Subledgers count: 105.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('c0749a38-7018-4918-8647-7c2f2e56a414', 136100, 'DEFERRED_TAX_ASSET', 'Deferred tax asset', 'Original GL Code: 100-136100-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('bd11eed6-9f32-44b4-8cbf-fd3e02ba1c04', 136200, 'DEFERRED_TAX_ASSET_NON_ADMITTED', 'Deferred tax asset - non-admitted', 'Original GL Code: 100-136200-000-0000-000000-00-0000. Subledgers count: 3.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('008f133d-262e-4115-be91-80a029c46c21', 160100, 'RECEIVABLE_FROM_SOUTHLAKE_FINANCIAL_HOLDINGS', 'Receivable from Southlake Financial Holdings', 'Original GL Code: 100-160100-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('cbbb4b05-54d1-4d40-813d-ba298e18a0cb', 160200, 'RECEIVABLE_FROM_WESTLAKE_SPECIALTY', 'Receivable from Westlake Specialty', 'Original GL Code: 100-160200-000-0000-000000-00-0000. Subledgers count: 2.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f70eac6b-3305-4980-9d50-cdab43adc564', 160300, 'RECEIVABLE_FROM_SOUTHLAKE_SPECIALTY', 'Receivable from Southlake Specialty', 'Original GL Code: 100-160300-000-0000-000000-00-0000. Subledgers count: 4.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d119762b-dd47-4bed-8d09-1f82f907b21f', 160400, 'RECEIVABLE_FROM_MGA', 'Receivable from MGA', 'Original GL Code: 100-160400-0
0-1101-000021-WA-0000. Subledgers count: 89.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('73a8c3ee-2b17-4f90-9cf0-80a5f52ddf62', 160500, 'RECEIVABLE_FROM_NEVADA_GENERAL', 'Receivable from Nevada General', 'Original GL Code: 100-160500-000-0000-000000-00-0000. Subledgers count: 2.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a917cd8d-03c8-4ca0-b10d-d85ce88289f0', 170100, 'PREPAID_EXPENSE', 'Prepaid expense', 'Original GL Code: 200-170100-000-0000-000000-00-0000. Subledgers count: 1.', 'eba64f9d-7005-4f26-8261-abb497632b99', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('982a0060-50da-4646-a05a-b27aab5e4f71', 200100, 'CASE_LOSS_RESERVES_DIRECT', 'Case Loss Reserves - Direct', 'Original GL Code: 100-200100-0
0-1101-000021-AL-0000. Subledgers count: 519.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('33e0196e-7127-46b0-89d9-5b99bda45dda', 200200, 'CASE_LOSS_RESERVES_CEDED', 'Case Loss Reserves - Ceded', 'Original GL Code: 100-200200-000-1601-000192-00-0000. Subledgers count: 30.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d5c2201b-8d65-493a-a5f1-273c52c1c211', 200300, 'CASE_LOSS_RESERVES_CEDED_200300_1', 'Case Loss Reserves - Ceded', 'Original GL Code: 100-200300-0
0-1101-000021-WA-0000. Subledgers count: 59.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('4549ac82-7405-44fd-ab4d-818b3253164a', 200400, 'IBNR_LOSS_RESERVES_DIRECT', 'IBNR Loss Reserves - Direct', 'Original GL Code: 000-200400-000-1101-000027-AL-0000. Subledgers count: 1234.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('80c366db-20bb-448d-8b24-35b1a9f549e5', 200500, 'IBNR_LOSS_RESERVES_ASSUMED', 'IBNR Loss Reserves - Assumed', 'Original GL Code: 100-200500-000-1501-000191-00-0000. Subledgers count: 52.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2d578b14-af96-4c67-9342-176e1aa0969e', 200600, 'IBNR_LOSS_RESERVES_CEDED', 'IBNR Loss Reserves - Ceded', 'Original GL Code: 100-200600-0
0-1101-000021-WA-0000. Subledgers count: 86.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('39ef88c9-75e8-4d00-8d15-b91f4ea6fbbf', 204100, 'REINSURANCE_PAYABLE_ON_PAID_LOSSES', 'Reinsurance payable on paid losses', 'Original GL Code: 100-204100-000-1501-000191-00-0000. Subledgers count: 32.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a3919a30-8fd1-4f1a-be3b-85a048efc563', 207100, 'LAE_DCC_RESERVES_DIRECT', 'LAE DCC Reserves - Direct', 'Original GL Code: 100-207100-0
0-1101-000021-AL-0000. Subledgers count: 276.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a81ad4b4-6e21-433f-8a92-9a7de7bd2908', 207200, 'LAE_DCC_RESERVES_ASSUMED', 'LAE DCC Reserves - Assumed', 'Original GL Code: 100-207200-000-1601-000192-00-0000. Subledgers count: 21.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('065aa2c6-da60-4788-aeee-a331294e1f37', 207300, 'LAE_DCC_RESERVES_CEDED', 'LAE DCC Reserves - Ceded', 'Original GL Code: 100-207300-000-0101-000194-00-0000. Subledgers count: 40.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('50976627-5924-47b3-82c5-9031a40690bc', 207400, 'IBNR_DCC_RESERVES_DIRECT', 'IBNR DCC Reserves - Direct', 'Original GL Code: 000-207400-000-1101-000027-AL-0000. Subledgers count: 891.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('6c978a90-82a8-4ccc-977d-59b8dc644ec6', 207500, 'IBNR_DCC_RESERVES_ASSUMED', 'IBNR DCC Reserves - Assumed', 'Original GL Code: 100-207500-000-1601-000192-00-0000. Subledgers count: 37.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('3d85d19d-ae92-4b5a-b046-ea8c5e616aa4', 207600, 'IBNR_DCC_RESERVES_CEDED', 'IBNR DCC Reserves - Ceded', 'Original GL Code: 100-207600-0
0-1101-000027-00-0000. Subledgers count: 68.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('3eb633c3-45fa-4b74-87c9-d5a24aa32fd6', 208100, 'LAE_A_O_RESERVES_DIRECT', 'LAE A&O Reserves - Direct', 'Original GL Code: 100-208100-0
0-1101-000021-AL-0000. Subledgers count: 266.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8bd1050d-5476-408c-b3e9-1ee4fb08d472', 208200, 'LAE_A_O_RESERVES_ASSUMED', 'LAE A&O Reserves - Assumed', 'Original GL Code: 100-208200-000-1701-000211-00-0000. Subledgers count: 12.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2e14ed44-5cc7-423e-97be-dcb5a0216844', 208300, 'LAE_A_O_RESERVES_CEDED', 'LAE A&O Reserves - Ceded', 'Original GL Code: 100-208300-000-0201-000090-00-0000. Subledgers count: 32.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('0506fe45-4209-452d-92e8-471d40bd04c4', 208400, 'IBNR_A_O_RESERVES_DIRECT', 'IBNR A&O Reserves - Direct', 'Original GL Code: 100-208400-0
0-1101-000021-AL-0000. Subledgers count: 400.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a1696b30-7307-4c3f-8481-ca8a42276a27', 208500, 'IBNR_A_O_RESERVES_ASSUMED', 'IBNR A&O Reserves - Assumed', 'Original GL Code: 100-208500-000-1701-000211-00-0000. Subledgers count: 15.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('520c7201-dfbc-4fc6-9453-b4a0d4acfef5', 208600, 'IBNR_A_O_RESERVES_CEDED', 'IBNR A&O Reserves - Ceded', 'Original GL Code: 100-208600-0
0-1101-000021-WA-0000. Subledgers count: 36.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d6df26eb-6428-42d3-9ba8-8b56a321f5e1', 209400, 'IBNR_ULAE_RESERVES_DIRECT', 'IBNR ULAE Reserves - Direct', 'Original GL Code: 100-209400-0
0-1101-000021-AL-0000. Subledgers count: 1073.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2fdc9af1-a371-4f2d-9ba0-f388587b7722', 209500, 'IBNR_ULAE_RESERVES_ASSUMED', 'IBNR ULAE Reserves - Assumed', 'Original GL Code: 100-209500-000-1501-000191-00-0000. Subledgers count: 49.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('b525a521-d4ba-4286-a75a-1353805d7c66', 209600, 'IBNR_ULAE_RESERVES_CEDED', 'IBNR ULAE Reserves - Ceded', 'Original GL Code: 100-209600-000-0101-000194-00-0000. Subledgers count: 74.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('da34f570-cce7-4e90-941c-62e20e2d5d5c', 210100, 'COMMISSION_PAYABLE_DIRECT', 'Commission payable direct', 'Original GL Code: 100-210100-000-0000-000000-00-0000. Subledgers count: 1.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d443e599-3136-46aa-84a2-f9c72939b6b3', 210200, 'COMMISSION_PAYABLE_ASSUMED', 'Commission payable assumed', 'Original GL Code: 120-210200-000-0000-000000-00-0000. Subledgers count: 1.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2c5a1b26-b764-4e34-8d08-7849e790411c', 214100, 'ACCOUNTS_PAYABLE', 'Accounts payable', 'Original GL Code: 100-214100-000-0000-000000-00-0000. Subledgers count: 1.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('5f82a02a-632c-48b9-8d16-4d73339e6467', 214200, 'GENERAL_EXPENSES_DUE_AND_ACCRUED', 'General expenses due and accrued', 'Original GL Code: 100-214200-000-0000-000000-00-0000. Subledgers count: 4.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('3c0664cc-fc36-45f8-9158-ec23970457c4', 217100, 'TAXES_LICENSES_AND_FEES_DUE_AND_ACCRUED', 'Taxes, licenses and fees due and accrued', 'Original GL Code: 100-217100-000-0000-000000-00-0000. Subledgers count: 3.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('cf0b07dd-ddb7-464f-8999-3fb850020bb3', 220100, 'FEDERAL_INCOME_TAXES_PAYABLE', 'Federal income taxes payable', 'Original GL Code: 100-220100-000-0000-000000-00-0000. Subledgers count: 3.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('7ab9c4f8-2a98-4a73-90eb-fd000dd6f58c', 230100, 'UNEARNED_PREM_DIRECT', 'Unearned Prem Direct', 'Original GL Code: 000-230100-000-1101-000027-AL-0000. Subledgers count: 1243.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('cd730a54-7593-447a-9533-86a7068d3e80', 230200, 'UNEARNED_PREM_ASSUMED', 'Unearned Prem Assumed', 'Original GL Code: 100-230200-000-1501-000191-00-0000. Subledgers count: 44.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('313e8aee-6a1a-43c8-9e8f-7c2733415c84', 230300, 'UNEARNED_PREM_CEDED', 'Unearned Prem Ceded', 'Original GL Code: 100-230300-0
0-1101-000027-00-0000. Subledgers count: 77.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('26d6d461-9a05-4517-945d-9aa004f996ef', 243100, 'CEDED_REINSURANCE_PREMIUMS_PAYABLE', 'Ceded Reinsurance Premiums Payable', 'Original GL Code: 100-243100-0
0-1101-000027-00-0000. Subledgers count: 101.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('272b96d7-afdf-4223-85c3-a286ba71ecea', 243200, 'DEFERRED_CEDING_COMMISSIONS', 'Deferred Ceding Commissions', 'Original GL Code: 100-243200-0
0-1101-000027-00-0000. Subledgers count: 132.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('281d8a3b-dca0-4c39-b350-abd3ad44a8ad', 245100, 'FUNDS_HELD_UNDER_REINSURANCE_TREATIES', 'Funds Held Under Reinsurance Treaties', 'Original GL Code: 000-245100-000-0000-000000-00-0000. Subledgers count: 13.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('868d4c84-55bb-47fe-8f90-bf2e1f780531', 247100, 'AMOUNTS_WITHHELD_OR_RETAINED', 'Amounts withheld or retained', 'Original GL Code: 100-247100-000-0000-000000-00-0000. Subledgers count: 11.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('0abac75e-d074-4ef8-9b0f-d9a6604c1008', 247200, '401K_WITHHELD', '401k Withheld', 'Original GL Code: 100-247200-000-0000-000000-00-0000. Subledgers count: 3.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('cceb0066-2029-46fb-89e5-6b800ccc6cd6', 247300, 'BENEFITS_WITHHELD', 'Benefits withheld', 'Original GL Code: 100-247300-000-0000-000000-00-0000. Subledgers count: 3.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('e624a80c-d822-49d0-8532-45ae498f33a3', 254100, 'PROVISION_FOR_REINSURANCE', 'Provision for Reinsurance', 'Original GL Code: 000-254100-000-0000-000000-00-0000. Subledgers count: 3.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('063e2d83-60e2-4e14-b02e-373344b35f53', 264100, 'PAYABLE_TO_SOUTHLAKE_FINANCIAL_HOLDINGS', 'Payable to Southlake Financial Holdings', 'Original GL Code: 100-264100-000-0000-000000-00-0000. Subledgers count: 4.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('18dabbfe-18fa-49cb-ac28-506ba6747d4e', 264200, 'PAYABLE_TO_WESTLEAKE_SPECIALTY', 'Payable to Westleake Specialty', 'Original GL Code: 100-264200-000-0000-000000-00-0000. Subledgers count: 2.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('28a7e0b8-0bd7-41b3-8f83-69f927b92214', 264300, 'PAYABLE_TO_SOUTHLAKE_SPECIALTY', 'Payable to Southlake Specialty', 'Original GL Code: 100-264300-000-0000-000000-00-0000. Subledgers count: 3.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('58914c4e-1c0d-4083-a745-ec963532a38b', 264400, 'PAYABLE_TO_MGA', 'Payable to MGA', 'Original GL Code: 100-264400-0
0-1101-000021-WA-0000. Subledgers count: 98.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('c1889ff7-cc98-4fcd-a347-dfe982ea804e', 264500, 'PAYABLE_TO_NEVADA_GENERAL', 'Payable to Nevada General', 'Original GL Code: 100-264500-000-0000-000000-00-0000. Subledgers count: 2.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('7ea1a07d-b386-4df2-b69e-c1f73c49bee1', 270100, 'PAYABLE_FOR_SECURITIES', 'Payable for securities', 'Original GL Code: 100-270100-000-0000-000000-00-0000. Subledgers count: 1.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('57b5e346-36b5-4aa1-89d0-03e64992c2bf', 290100, 'INVESTMENT_SUSPENSE', 'Investment suspense', 'Original GL Code: 100-290100-000-0000-000000-00-0000. Subledgers count: 2.', '508a065f-d3f8-44f3-bd65-3863afe968ac', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('500aafb7-53b3-4c14-8242-8ab64c79f250', 300100, 'WRITE_IN_FOR_SPECIAL_SURPLUS_FUNDS', 'Write in for special surplus funds', 'Original GL Code: 100-300100-000-0000-000000-00-0000. Subledgers count: 1.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('b9956d96-ae45-4adc-98ab-fdf8d6509009', 300200, 'COMMON_STOCK', 'Common stock', 'Original GL Code: 100-300200-000-0000-000000-00-0000. Subledgers count: 3.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('74a65f62-521a-40ac-a9b9-b399afee70d9', 300600, 'PAID_IN_CAPITAL', 'Paid in capital', 'Original GL Code: 100-300600-000-0000-000000-00-0000. Subledgers count: 4.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('988d7761-88cf-4783-abf4-0475bfc79630', 302010, 'BONDS_MARK_TO_MARKET_302010_1', 'Bonds - Mark to market', 'Original GL Code: 120-302010-000-0000-000000-00-0000. Subledgers count: 1.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8a4a5f1d-c872-475f-ba8f-2c06142f3d8e', 302020, 'UNAFF_PREFERRED_STOCKS_MARK_TO_MARKET', 'Unaff Preferred Stocks - Mark to market', 'Original GL Code: 100-302020-000-0000-000000-00-0000. Subledgers count: 1.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('21384b29-e8a3-4985-b546-2bef91cff5f6', 302030, 'UNAFFIL_COMMON_STOCK_MARK_TO_MARKET_302030_1', 'Unaffil Common Stock - Mark to market', 'Original GL Code: 100-302030-000-0000-000000-00-0000. Subledgers count: 1.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('b624bef0-3126-45e8-8057-964175ebbaa4', 302035, 'AFFIL_COMMON_STOCK_MARK_TO_MARKET_302035_1', 'Affil Common Stock - Mark to market', 'Original GL Code: 100-302035-000-0000-000000-00-0000. Subledgers count: 1.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('09e0b022-79a2-44f6-80e5-c87f533ae28a', 302070, 'CASH_EQUIVALENTS_MARK_TO_MARKET_302070_1', 'Cash equivalents - mark to market', 'Original GL Code: 100-302070-000-0000-000000-00-0000. Subledgers count: 3.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('bb85bdec-1471-405d-a01f-19668bc17a9c', 304070, 'TAX_ON_CASH_EQUIVALENTS_MARK_TO_MARKET', 'Tax on Cash equivalents - mark to market', 'Original GL Code: 100-304070-000-0000-000000-00-0000. Subledgers count: 3.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d3fcda35-c293-4de5-86ca-a64d84b97749', 308000, 'CHANGE_IN_DEFERRED_TAX', 'Change in deferred tax', 'Original GL Code: 100-308000-000-0000-000000-00-0000. Subledgers count: 3.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('5be15708-caa3-4e82-8149-4d7e6d55213c', 309000, 'CHANGE_IN_NON_ADMITTED', 'Change in non-admitted', 'Original GL Code: 100-309000-000-0000-000000-00-0000. Subledgers count: 4.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f6cf65d6-cd9a-415b-aea1-293f6887a8c2', 390000, 'UNASSIGNED_FUNDS', 'Unassigned funds', 'Original GL Code: 100-390000-000-0000-000000-00-0000. Subledgers count: 4.', 'eb839704-dcf5-45f6-8da4-9e4142f8a652', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('dbcb7414-e71b-47f6-b1d7-d5d61805ceaa', 400100, 'DIRECT_PREMIUM_WRITTEN', 'Direct Premium Written', 'Original GL Code: 000-400100-000-1101-000027-AL-0000. Subledgers count: 1243.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('84525e9a-2954-448d-861e-f0de2ad0adaf', 400200, 'ASSUMED_PREMIUM_WRITTEN', 'Assumed premium written', 'Original GL Code: 100-400200-000-1501-000191-00-0000. Subledgers count: 46.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('1f1df32b-d49f-4f3f-84df-601df78a3f91', 400300, 'CEDED_PREMIUM_WRITTEN', 'Ceded premium written', 'Original GL Code: 100-400300-0
0-1101-000027-00-0000. Subledgers count: 91.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('abd61f21-4507-4218-8526-987a10643554', 411100, 'CHANGE_IN_UPR_DIRECT', 'Change in upr direct', 'Original GL Code: 000-411100-000-1101-000027-AL-0000. Subledgers count: 1244.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('97567fda-84c9-41b1-8828-7ffb3069fab5', 411200, 'CHANGE_IN_UPR_ASSUMED', 'Change in upr assumed', 'Original GL Code: 100-411200-000-1501-000191-00-0000. Subledgers count: 44.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('625f985e-3a71-4652-852f-bb15e1012f23', 411300, 'CHANGE_IN_UPR_CEDED', 'Change in upr ceded', 'Original GL Code: 100-411300-0
0-1101-000027-00-0000. Subledgers count: 80.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('4fb88e57-43a3-4ab5-aba5-1135ec0ab51b', 450100, 'INTEREST_RECEIVED_ON_US_GOVT_BONDS', 'Interest Received on US Govt Bonds', 'Original GL Code: 100-450100-000-0000-000000-00-0000. Subledgers count: 3.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('25e3e35c-c448-491a-b78f-3b03968c450e', 450200, 'INTEREST_PAID_ON_US_GOVT_BONDS', 'Interest Paid on US Govt Bonds', 'Original GL Code: 100-450200-000-0000-000000-00-0000. Subledgers count: 3.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2b0239da-df73-4c4d-8b31-7572a4e9642d', 450300, 'ACCRUAL_OF_DISCOUNT_US_GOVT_BONDS', 'Accrual of Discount US Govt Bonds', 'Original GL Code: 100-450300-000-0000-000000-00-0000. Subledgers count: 3.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('acf0b32b-4ac4-4f77-b73a-98c459fea64c', 450400, 'AMORTIZATION_OF_PREMIUM_US_GOVT_BONDS', 'Amortization of Premium US Govt Bonds', 'Original GL Code: 100-450400-000-0000-000000-00-0000. Subledgers count: 3.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('251c2ebd-49ee-4558-8ceb-6fe4656d9cc2', 450500, 'CHANGE_IN_ACCRUED_US_GOVT', 'Change in accrued US Govt', 'Original GL Code: 100-450500-000-0000-000000-00-0000. Subledgers count: 3.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2345d324-a937-4fde-ac17-294c22df4147', 451100, 'INTEREST_RECEIVED_OTHER_BONDS', 'Interest Received Other Bonds', 'Original GL Code: 120-451100-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('5eda1917-5fc2-4d4a-ba84-a4f539d77e01', 451200, 'INTEREST_PAID_ON_OTHER_BONDS', 'Interest Paid on Other Bonds', 'Original GL Code: 120-451200-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('7c7b42d9-527e-4b38-8061-13635dbbf20a', 451300, 'ACCRUAL_OF_DISCOUNT_OTHER_BONDS', 'Accrual of Discount Other Bonds', 'Original GL Code: 120-451300-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d82c43b8-877a-4613-9106-03114f41008f', 451400, 'AMORTIZATION_OF_PREMIUM_OTHER_BONDS', 'Amortization of Premium Other Bonds', 'Original GL Code: 120-451400-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('547a177b-5791-4527-b96d-ab7a2adae214', 451500, 'CHANGE_IN_ACCRUED_OTHER_BONDS', 'Change in accrued Other Bonds', 'Original GL Code: 120-451500-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('327a9dff-1109-4170-889c-39ffb159975b', 453100, 'INTEREST_RECEIVED_PREFERRED_STOCKS', 'Interest Received Preferred Stocks', 'Original GL Code: 100-453100-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8742c759-3eae-477c-8d3e-7a2d6cfc0e3c', 455100, 'DIVIDENDS_RECEIVED_COMMON_STOCKS', 'Dividends Received Common Stocks', 'Original GL Code: 100-455100-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d58e742e-0506-4640-883b-824f7266c966', 457100, 'INTEREST_RECEIVED_MORTGAGE_LOANS', 'Interest Received Mortgage Loans', 'Original GL Code: 100-457100-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('708f5424-be8b-47e3-9587-09c8b84da241', 460100, 'INTEREST_RECEIVED_ON_CASH', 'Interest Received on Cash', 'Original GL Code: 100-460100-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('03ea61d2-ef47-4a2d-9139-0405958b5b58', 461100, 'INTEREST_RECEIVED_ON_CASH_EQUIVALENTS', 'Interest Received on Cash Equivalents', 'Original GL Code: 100-461100-000-0000-000000-00-0000. Subledgers count: 3.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('ad80ec3b-16df-4d66-aacd-cd519dda1325', 461300, 'ACCRUAL_OF_DISCOUNT_ON_CASH_EQUIVALENTS', 'Accrual of Discount on Cash Equivalents', 'Original GL Code: 100-461300-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('65b2bda0-dc90-45bd-b9fa-adf8b019a13c', 461500, 'CHANGE_IN_ACCRUED_CASH_EQUIVALENTS', 'Change in accrued Cash Equivalents', 'Original GL Code: 100-461500-000-0000-000000-00-0000. Subledgers count: 3.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('60de77ed-73db-4fd3-9940-9fe3bc251d6a', 462100, 'INTEREST_RECEIVED_ON_SHORT_TERM', 'Interest Received on Short Term', 'Original GL Code: 100-462100-000-0000-000000-00-0000. Subledgers count: 2.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('5e769447-beb4-43ca-98a5-80d2fe0c38ee', 462200, 'INTEREST_PAID_ON_SHORT_TERM', 'Interest Paid on Short Term', 'Original GL Code: 100-462200-000-0000-000000-00-0000. Subledgers count: 2.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('424abb42-dfe9-4a20-8161-518d7137348c', 462300, 'ACCRUAL_OF_DISCOUNT_ON_SHORT_TERM', 'Accrual of Discount on Short Term', 'Original GL Code: 100-462300-000-0000-000000-00-0000. Subledgers count: 2.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2cb29b9e-66d8-45d1-80b4-27c5bc218d45', 462400, 'AMORTIZATION_OF_PREMIUM_ON_SHORT_TERM', 'Amortization of Premium on Short Term', 'Original GL Code: 100-462400-000-0000-000000-00-0000. Subledgers count: 2.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('088e2f73-5e8c-4f41-8cd2-9e9111b75737', 462500, 'CHANGE_IN_ACCRUED_SHORT_TERM', 'Change in accrued short term', 'Original GL Code: 100-462500-000-0000-000000-00-0000. Subledgers count: 2.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('374b002f-bb86-4c5f-9e0f-1e02e5d6e3c5', 464100, 'INTEREST_RECEIVED_ON_OTHER_INVESTED_ASSETS', 'Interest Received on Other Invested Assets', 'Original GL Code: 100-464100-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('0015c26f-8684-43e3-b4f7-7a2fdadcb802', 464500, 'CHANGE_IN_ACCRUED_OTHER_INVESTED_ASSETS', 'Change in accrued Other Invested Assets', 'Original GL Code: 100-464500-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8fe6e2c4-98fd-427f-bdf3-6c9bd1571c84', 480300, 'CUSTODY_CHARGES', 'Custody charges', 'Original GL Code: 100-480300-000-0000-000000-00-0000. Subledgers count: 3.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8ab197bb-1b1f-4e71-9e34-7424d9a059cb', 480310, 'BANK_CHARGES', 'Bank charges', 'Original GL Code: 100-480310-000-0000-000000-00-0000. Subledgers count: 4.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('4c18e346-e8c9-4559-9299-1d525acf9a18', 480320, 'INVESTMENT_ACCOUNTING_FEES', 'Investment accounting fees', 'Original GL Code: 100-480320-000-0000-000000-00-0000. Subledgers count: 4.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('3eb386bb-d417-4111-b9b6-def3cdbb3825', 480500, 'INTEREST_INCOME_EXPENSE_ON_FUNDS_HELD', 'Interest Income / Expense on Funds Held', 'Original GL Code: 100-480500-000-0000-000000-00-0000. Subledgers count: 1.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f3c28a63-0168-4cee-88bb-a05196109b83', 488100, 'UNDISTRIBUTED_INCOME_OF_SUBS', 'Undistributed income of subs', 'Original GL Code: 100-488100-000-0000-000000-00-0000. Subledgers count: 3.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('e42e1b29-ffcf-487a-9f56-9219f6e827a6', 490000, 'FINANCE_AND_SERVICE_CHARGES', 'Finance and service charges', 'Original GL Code: 100-490000-000-0000-000000-00-0000. Subledgers count: 2.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('775408fc-b500-4b80-afbc-204e338c7fc4', 490100, 'MISCELLANEOUS_INCOME', 'Miscellaneous income', 'Original GL Code: 100-490100-000-0000-000000-00-0000. Subledgers count: 4.', 'edf606f7-d7bc-483a-93a4-4fe2e4d55a25', false, 'credit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('c9fad082-bdfd-4b09-b42d-d588e1654b2a', 500100, 'COMMISSIONS_DIRECT', 'Commissions Direct', 'Original GL Code: 000-500100-000-1101-000027-AL-0000. Subledgers count: 1241.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('66645042-7bd7-465f-b113-0d26117a36ae', 500110, 'FRONTING_FEES', 'Fronting fees', 'Original GL Code: 100-500110-0
0-1101-000021-AL-0000. Subledgers count: 695.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('00284173-97e4-4d55-9002-b9f91ecca32d', 500200, 'COMMISSIONS_ASSUMED', 'Commissions Assumed', 'Original GL Code: 100-500200-000-1501-000191-00-0000. Subledgers count: 94.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('3b9214f6-414f-4967-98b5-a4e4972b94d8', 500300, 'COMMISSIONS_CEDED', 'Commissions Ceded', 'Original GL Code: 000-500300-000-1101-000027-AL-0000. Subledgers count: 966.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('1abf74a9-f405-4fe5-ad2b-1fab7d00edc5', 501100, 'CHANGE_IN_COMM_PAY_DIRECT', 'Change in comm pay direct', 'Original GL Code: 100-501100-000-0502-000194-CA-0000. Subledgers count: 6.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('192b9bbf-853f-48da-a643-e1f97fb2f192', 502100, 'CONTINGENT_COMMISSIONS_DIRECT', 'Contingent Commissions Direct', 'Original GL Code: 120-502100-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('6b1314fd-8365-4f1b-8043-cce17f6507e0', 550100, 'CHANGE_IN_CASE_LOSS_RESERVES_DIRECT', 'Change in Case Loss Reserves - Direct', 'Original GL Code: 100-550100-0
0-1101-000027-AL-0000. Subledgers count: 516.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('acaf7c0e-9068-427f-9b3a-379a27c2b145', 550200, 'CHANGE_IN_CAE_LOSS_RESERVES_ASSUMED', 'Change in Cae Loss Reserves - Assumed', 'Original GL Code: 100-550200-000-1601-000192-00-0000. Subledgers count: 30.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('71a8f669-8a05-4fad-8e2c-391a502fc585', 550300, 'CHANGE_IN_CASE_LOSS_RESERVES_CEDED', 'Change in Case Loss Reserves - Ceded', 'Original GL Code: 100-550300-000-0101-000194-00-0000. Subledgers count: 59.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d1d5ad8c-b5ea-460b-9e37-a6991cdcc21e', 550400, 'CHANGE_IN_IBNR_LOSS_RESERVES_DIRECT', 'Change in IBNR Loss Reserves - Direct', 'Original GL Code: 000-550400-000-1101-000027-AL-0000. Subledgers count: 1233.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('1f874df7-b66d-410d-a10f-5d136f14cf00', 550500, 'CHANGE_IN_IBNR_LOSS_RESERVES_ASSUMED', 'Change in IBNR Loss Reserves - Assumed', 'Original GL Code: 100-550500-000-1501-000191-00-0000. Subledgers count: 52.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('efa68d6e-4a44-468e-8d9c-731d2a6085a1', 550600, 'CHANGE_IN_IBNR_LOSS_RESERVES_CEDED', 'Change in IBNR Loss Reserves - Ceded', 'Original GL Code: 100-550600-0
0-1101-000027-00-0000. Subledgers count: 88.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('3dfc06f8-afb9-4a54-b072-7bf894d2f017', 557100, 'CHANGE_IN_LAE_DCC_RESERVES_DIRECT', 'Change in LAE DCC Reserves - Direct', 'Original GL Code: 100-557100-0
0-1101-000021-AL-0000. Subledgers count: 278.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8d94afbc-c6a7-4fd8-88bc-2f7d47bd8c90', 557200, 'CHANGE_IN_LAE_DCC_RESERVES_ASSUMED', 'Change in LAE DCC Reserves - Assumed', 'Original GL Code: 100-557200-000-1601-000192-00-0000. Subledgers count: 22.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('7b10ec28-6a2a-4407-bd45-d5a650ae7b68', 557300, 'CHANGE_IN_LAE_DCC_RESERVES_CEDED', 'Change in LAE DCC Reserves - Ceded', 'Original GL Code: 100-557300-0
0-1101-000021-WA-0000. Subledgers count: 41.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('84ca4d9d-b852-4a76-a350-fe2d2327504c', 557400, 'CHANGE_IN_IBNR_DCC_RESERVES_DIRECT', 'Change in IBNR DCC Reserves - Direct', 'Original GL Code: 000-557400-000-1101-000027-AL-0000. Subledgers count: 885.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d06df173-a5e2-48c2-90b6-95f3ddfe25ef', 557500, 'CHANGE_IN_IBNR_DCC_RESERVES_ASSUMED', 'Change in IBNR DCC Reserves - Assumed', 'Original GL Code: 100-557500-000-1601-000192-00-0000. Subledgers count: 35.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('566f8852-cfc8-4991-980f-ecd40f1397e6', 557600, 'CHANGE_IN_IBNR_DCC_RESERVES_CEDED', 'Change in IBNR DCC Reserves - Ceded', 'Original GL Code: 100-557600-0
0-1101-000021-WA-0000. Subledgers count: 67.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a168225d-135f-49fc-b4f4-ed74b0ffd842', 558100, 'CHANGE_IN_LAE_A_O_RESERVES_DIRECT', 'Change in LAE A&O Reserves - Direct', 'Original GL Code: 100-558100-0
0-1101-000021-AL-0000. Subledgers count: 266.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('9c69c82b-32c0-4197-adbe-390664859868', 558200, 'CHANGE_IN_LAE_A_O_RESERVES_ASSUMED', 'Change in LAE A&O Reserves - Assumed', 'Original GL Code: 100-558200-000-1701-000211-00-0000. Subledgers count: 11.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('0705e97d-6f79-48bd-a423-e9ab243e49ae', 558300, 'CHANGE_IN_LAE_A_O_RESERVES_CEDED', 'Change in LAE A&O Reserves - Ceded', 'Original GL Code: 100-558300-000-0201-000090-00-0000. Subledgers count: 32.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('09a32eb1-568c-481b-8325-348eab607263', 558400, 'CHANGE_IN_IBNR_A_O_RESERVES_DIRECT', 'Change in IBNR A&O Reserves - Direct', 'Original GL Code: 100-558400-0
0-1101-000021-AL-0000. Subledgers count: 400.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('1881cb7c-b47e-4154-8496-daede27559d5', 558500, 'CHANGE_IN_IBNR_A_O_RESERVES_ASSUMED', 'Change in IBNR A&O Reserves - Assumed', 'Original GL Code: 100-558500-000-1701-000211-00-0000. Subledgers count: 15.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('e2cc9ee4-8bb4-4e84-b242-19b13beb124c', 558600, 'CHANGE_IN_IBNR_A_O_RESERVES_CEDED', 'Change in IBNR A&O Reserves - Ceded', 'Original GL Code: 100-558600-000-0201-000090-00-0000. Subledgers count: 36.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('e6553513-e117-4187-ad03-2e054f467fd2', 559400, 'CHANGE_IN_IBNR_ULAE_RESERVES_DIRECT', 'Change in IBNR ULAE Reserves - Direct', 'Original GL Code: 100-559400-0
0-1101-000021-AL-0000. Subledgers count: 1075.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('bba27cc4-b007-41cf-a329-5976b4449189', 559500, 'CHANGE_IN_IBNR_ULAE_RESERVES_ASSUMED', 'Change in IBNR ULAE Reserves - Assumed', 'Original GL Code: 100-559500-000-1501-000191-00-0000. Subledgers count: 50.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('66c0978d-0a1b-492b-8793-541b410d824c', 559600, 'CHANGE_IN_IBNR_ULAE_RESERVES_CEDED', 'Change in IBNR ULAE Reserves - Ceded', 'Original GL Code: 100-559600-0
0-1101-000021-WA-0000. Subledgers count: 75.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('57e0521a-dae6-4f4d-8c8a-9eec802a9c6a', 600100, 'DIRECT_LOSSES_PAID', 'Direct Losses Paid', 'Original GL Code: 100-600100-0
0-1101-000021-AL-0000. Subledgers count: 428.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2da08b5d-2b62-4b0f-b966-c13b424c77a9', 600200, 'ASSUMED_LOSSES_PAID', 'Assumed Losses Paid', 'Original GL Code: 100-600200-000-1501-000191-00-0000. Subledgers count: 30.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('94ed3c31-6e92-4a0f-9d77-61aaa35b5eef', 600300, 'CEDED_LOSSES_PAID', 'Ceded Losses Paid', 'Original GL Code: 100-600300-000-0101-000194-00-0000. Subledgers count: 62.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('6cdb8c88-d738-4a17-a109-bd7db7c2d67f', 601100, 'DIRECT_LAE_DCC_PAID', 'Direct LAE DCC Paid', 'Original GL Code: 100-601100-0
0-1101-000021-AL-0000. Subledgers count: 248.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('1a378b94-f9e8-4832-8e04-aa595bfe8372', 601200, 'ASSUMED_LAE_DCC_PAID', 'Assumed LAE DCC Paid', 'Original GL Code: 100-601200-000-1601-000192-00-0000. Subledgers count: 20.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('b83f03a8-0984-4b05-8268-c751b960041f', 601300, 'CEDED_LAE_DCC_PAID', 'Ceded LAE DCC Paid', 'Original GL Code: 100-601300-0
0-1101-000021-WA-0000. Subledgers count: 51.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('3beaa3c4-4c50-4297-98d9-c3703639f6ba', 602100, 'DIRECT_LAE_A_O_PAID', 'Direct LAE A&O Paid', 'Original GL Code: 100-602100-0
0-1101-000021-AL-0000. Subledgers count: 225.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('49455982-e003-4095-a0f6-0d8394cb9197', 602200, 'ASSUMED_LAE_A_O_PAID', 'Assumed LAE A&O Paid', 'Original GL Code: 100-602200-000-1701-000211-00-0000. Subledgers count: 9.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('84dd37a7-a79e-46dd-b998-0bec6e4a6f54', 602300, 'CEDED_LAE_A_O_PAID', 'Ceded LAE A&O Paid', 'Original GL Code: 100-602300-000-0201-000090-00-0000. Subledgers count: 30.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a940ae55-49b0-4acf-95cb-72e079b708fa', 603100, 'DIRECT_ULAE_PAID', 'Direct ULAE Paid', 'Original GL Code: 100-603100-0
0-1101-000021-AL-0000. Subledgers count: 642.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('8e52fa7b-0782-49d6-9a1d-54d9d1dddc06', 603200, 'ASSUMED_ULAE_PAID', 'Assumed ULAE Paid', 'Original GL Code: 100-603200-000-1501-000191-00-0000. Subledgers count: 14.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('ca8351b7-b751-4989-a27e-d5bedf5b150b', 603300, 'CEDED_ULAE_PAID', 'Ceded ULAE Paid', 'Original GL Code: 100-603300-0
0-1101-000021-WA-0000. Subledgers count: 49.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('1b18bf77-99cf-4bb7-a517-cc14c9e7bd8e', 700100, 'ALLOWANCES_TO_MANAGERS_AND_AGENTS', 'Allowances to managers and agents', 'Original GL Code: 120-700100-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('77c892bb-5737-4ac8-93d7-c241bd11f483', 700200, 'ADVERTISING', 'Advertising', 'Original GL Code: 100-700200-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('80a0e854-1875-4ef0-8ab1-4b3c4c465e68', 700300, 'BOARD_FEES', 'Board fees', 'Original GL Code: 100-700300-000-0000-000000-00-0000. Subledgers count: 2.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('5e4bd2e3-6ce7-437a-849d-9299a3585434', 700310, 'BUREAU_AND_ASSOCIATION_FEES', 'Bureau and association fees', 'Original GL Code: 100-700310-0
0-1101-000027-00-0000. Subledgers count: 57.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('9655224f-a711-4e5e-920a-377eabaa5576', 700600, 'SALARIES', 'Salaries', 'Original GL Code: 100-700600-000-0000-000000-00-0000. Subledgers count: 4.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('660e0cb2-f398-447b-b759-de19f0d423f1', 700710, '401K_MATCH', '401k match', 'Original GL Code: 100-700710-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('4c1595cc-0e2a-479b-84d3-46f94c5faba7', 700720, 'OTHER_EMPLOYEE_WELFARE', 'Other employee welfare', 'Original GL Code: 100-700720-000-0000-000000-00-0000. Subledgers count: 4.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('899b198d-df70-4a30-be86-c7357954625a', 700800, 'INSURANCE', 'Insurance', 'Original GL Code: 100-700800-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('6dbb7ffe-aff3-44e7-bb7b-5e43bcbeff78', 700850, 'DIRECTORS_FEES', 'Directors'' fees', 'Original GL Code: 100-700850-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a60a74a7-b23b-413c-909e-6784a23fb558', 701000, 'RENT', 'Rent', 'Original GL Code: 120-701000-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('0cd17245-73fd-4b20-83ac-fa4efba1ce16', 701210, 'SOFTWARE_MAINTENANCE', 'Software maintenance', 'Original GL Code: 100-701210-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('972416fa-2f04-4778-903f-0de838ba5d7b', 701300, 'PRINTING', 'Printing', 'Original GL Code: 120-701300-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2ff0319b-4b6b-4b91-9af5-9beec6fb270a', 701320, 'BOOKS_AND_PERIODICALS', 'Books and periodicals', 'Original GL Code: 100-701320-000-0000-000000-00-0000. Subledgers count: 2.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('197b933a-342b-4127-b56c-0aac8705ab70', 701410, 'TELEPHONE', 'Telephone', 'Original GL Code: 100-701410-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('c4f1f5a0-5a2e-4ffe-9085-ad2493771dad', 701500, 'LEGAL', 'Legal', 'Original GL Code: 100-701500-000-0000-000000-00-0000. Subledgers count: 4.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('5779c238-5bd3-468e-9898-8f2434d04910', 701600, 'AUDITING', 'Auditing', 'Original GL Code: 100-701600-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('4b5b92f6-8f80-4518-846b-05d03d47cdeb', 701700, 'ACTUARIAL', 'Actuarial', 'Original GL Code: 100-701700-000-0000-000000-00-0000. Subledgers count: 2.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('93bcef4c-df6a-4b45-a60f-92fe6c8efb33', 701800, 'CONSULTING', 'Consulting', 'Original GL Code: 100-701800-000-0000-000000-00-0000. Subledgers count: 4.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f0b1529e-a375-4dcc-a034-fe9e8235ccf7', 702100, 'UNDERWRITING_EXPENSES_PAID_ASSUMED', 'Underwriting Expenses Paid - Assumed', 'Original GL Code: 120-702100-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('b22c7d98-47e8-413b-9904-12953d264adb', 704900, 'DEFERRED_GENERAL_EXPENSES', 'Deferred General Expenses', 'Original GL Code: 120-704900-000-0000-000000-00-0000. Subledgers count: 2.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f36eda64-4977-44d4-8ffd-40ab7bc6e582', 800100, 'STATE_AND_LOCAL_TAXES', 'State and local taxes', 'Original GL Code: 100-800100-000-0000-000000-00-0000. Subledgers count: 23.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('f031f77e-e60a-46c4-8dad-9973d5f442b0', 800200, 'INSURANE_DEPARTMENT_LICENSES_AND_FEES', 'Insurane department licenses and fees', 'Original GL Code: 100-800200-000-0000-000000-00-0000. Subledgers count: 11.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('5784a07f-c19b-4a9d-800d-a82c9a91d411', 800300, 'FUTA', 'FUTA', 'Original GL Code: 100-800300-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('d585b550-38f1-4551-8705-59985e2157d1', 800310, 'SUTA', 'SUTA', 'Original GL Code: 100-800310-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a6ad0a43-d634-4c9e-9f7b-74b672c45917', 800320, 'SOCIAL_SECURITY_TAXES', 'Social Security taxes', 'Original GL Code: 100-800320-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('daa3b053-c4e6-4f5f-9e1b-da7fdd79e7a9', 800400, 'GROSS_GUARANTY_ASSESSMENTS', 'Gross guaranty assessments', 'Original GL Code: 120-800400-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('29ed1ef5-c5ab-4b2d-a0bf-fbe8cd836241', 800500, 'ALL_OTHER_TLF_S', 'All other TLF''s', 'Original GL Code: 120-800500-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('9967ded1-ab0a-4667-a347-1ed30e8c4769', 900100, 'REALIZED_GAINS_ON_US_GOVT_BONDS', 'Realized Gains on US Govt Bonds', 'Original GL Code: 110-900100-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('51aef612-246d-402e-9934-611be4e830c8', 900200, 'REALIZED_LOSSES_ON_US_GOVT_BONDS', 'Realized Losses on US Govt Bonds', 'Original GL Code: 100-900200-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('ad47bdd0-1449-487b-b63a-d67e2c4fff28', 901100, 'REALIZED_GAINS_ON_OTHER_BONDS', 'Realized Gains on Other Bonds', 'Original GL Code: 120-901100-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('a367b618-a632-458c-bf45-2093ad4e7283', 910200, 'REALIZED_LOSSES_ON_CASH_EQUIVALENTS', 'Realized Losses on Cash Equivalents', 'Original GL Code: 100-910200-000-0000-000000-00-0000. Subledgers count: 2.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('cc3f39d2-1634-4dc2-9861-1145d90fcddc', 911200, 'REALIZED_LOSSES_ON_SHORT_TERM', 'Realized Losses on Short Term', 'Original GL Code: 110-911200-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('ec573715-2f18-4731-b9f2-ebe0ba06eb27', 914100, 'REALIZED_GAINS_ON_OTHER_INVESTED_ASSETS', 'Realized Gains on Other Invested Assets', 'Original GL Code: 120-914100-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('2662fc8f-0c31-40ae-8c39-06685a8cd9b1', 914900, 'IMPAIRMENTS_ON_OTHER_INVESTED_ASSETS', 'Impairments on Other Invested Assets', 'Original GL Code: 100-914900-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('79532a88-9028-443e-9628-74dbe1d43aea', 930100, 'FEDERAL_INCOME_TAXES', 'Federal income taxes', 'Original GL Code: 100-930100-000-0000-000000-00-0000. Subledgers count: 3.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "chart_of_accounts" ("id", "account_code", "key", "description", "notes", "parent_id", "is_parent", "normal_balance", "next_number")
      VALUES ('b7512fb1-bcd1-495b-8001-b09ac8dabec1', 930200, 'CAPITAL_GAINS_TAXES', 'Capital gains taxes', 'Original GL Code: 110-930200-000-0000-000000-00-0000. Subledgers count: 1.', 'd27d17a3-1219-419f-9e0a-a83e227db55a', false, 'debit', NULL)
      ON CONFLICT ("account_code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Reverting chart of accounts seed...');
    await queryRunner.query(`DELETE FROM "chart_of_account_documents"`);
    await queryRunner.query(`DELETE FROM "chart_of_accounts"`);
  }
}
