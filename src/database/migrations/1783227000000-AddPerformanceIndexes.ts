import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds indexes for every foreign-key column and every frequently
 * filtered/sorted column across the schema (audit finding: zero @Index
 * decorators existed anywhere), plus missing composite unique constraints
 * on join tables that were previously allowing duplicate rows.
 */
export class AddPerformanceIndexes1783227000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1783227000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const indexes: string[] = [
      // journal_entries
      `CREATE INDEX IF NOT EXISTS idx_journal_entries_batch_id ON journal_entries(batch_id)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entries_coa_id ON journal_entries(coa_id)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date)`,

      // journal_entry_batches
      `CREATE INDEX IF NOT EXISTS idx_journal_entry_batches_treaty_id ON journal_entry_batches(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entry_batches_month_key ON journal_entry_batches(month_key)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entry_batches_workbook_id ON journal_entry_batches(workbook_id)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entry_batches_state_code ON journal_entry_batches(state_code)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entry_batches_status ON journal_entry_batches(status)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entry_batches_period ON journal_entry_batches(period)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entry_batches_is_deleted ON journal_entry_batches(is_deleted)`,

      // journal_entry_drafts
      `CREATE INDEX IF NOT EXISTS idx_journal_entry_drafts_batch_id ON journal_entry_drafts(batch_id)`,
      `CREATE INDEX IF NOT EXISTS idx_journal_entry_drafts_is_deleted ON journal_entry_drafts(is_deleted)`,

      // activity_logs
      `CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_logs_module_id ON activity_logs(module_id)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_logs_submodule_id ON activity_logs(submodule_id)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)`,

      // treaties
      `CREATE INDEX IF NOT EXISTS idx_treaties_mga_id ON treaties(mga_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaties_reinsurer_id ON treaties(reinsurer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaties_risk_company_id ON treaties(risk_company_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaties_is_active ON treaties(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_treaties_is_deleted ON treaties(is_deleted)`,

      // treaty_lobs
      `CREATE INDEX IF NOT EXISTS idx_treaty_lobs_treaty_id ON treaty_lobs(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_lobs_lob_id ON treaty_lobs(lob_id)`,

      // treaty_lob_cobs
      `CREATE INDEX IF NOT EXISTS idx_treaty_lob_cobs_treaty_lob_id ON treaty_lob_cobs(treaty_lob_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_lob_cobs_cob_id ON treaty_lob_cobs(cob_id)`,

      // treaty_states
      `CREATE INDEX IF NOT EXISTS idx_treaty_states_treaty_id ON treaty_states(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_states_state_id ON treaty_states(state_id)`,

      // treaty_mgas
      `CREATE INDEX IF NOT EXISTS idx_treaty_mgas_treaty_id ON treaty_mgas(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_mgas_mga_id ON treaty_mgas(mga_id)`,

      // treaty_state_carriers
      `CREATE INDEX IF NOT EXISTS idx_treaty_state_carriers_treaty_id ON treaty_state_carriers(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_state_carriers_risk_company_id ON treaty_state_carriers(risk_company_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_state_carriers_state_id ON treaty_state_carriers(state_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_state_carriers_broker_id ON treaty_state_carriers(broker_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_state_carriers_is_deleted ON treaty_state_carriers(is_deleted)`,

      // treaty_reinsurers
      `CREATE INDEX IF NOT EXISTS idx_treaty_reinsurers_treaty_id ON treaty_reinsurers(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_reinsurers_reinsurer_id ON treaty_reinsurers(reinsurer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_reinsurers_state_id ON treaty_reinsurers(state_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_reinsurers_broker_id ON treaty_reinsurers(broker_id)`,

      // treaty_products
      `CREATE INDEX IF NOT EXISTS idx_treaty_products_treaty_id ON treaty_products(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_products_product_id ON treaty_products(product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_products_is_deleted ON treaty_products(is_deleted)`,

      // treaty_itd_totals
      `CREATE INDEX IF NOT EXISTS idx_treaty_itd_totals_treaty_id ON treaty_itd_totals(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_itd_totals_year ON treaty_itd_totals(year)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_itd_totals_month ON treaty_itd_totals(month)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_itd_totals_state_id ON treaty_itd_totals(state_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_itd_totals_is_deleted ON treaty_itd_totals(is_deleted)`,

      // treaty_sequence_prefixes
      `CREATE INDEX IF NOT EXISTS idx_treaty_sequence_prefixes_treaty_id ON treaty_sequence_prefixes(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_sequence_prefixes_sequence_prefix_id ON treaty_sequence_prefixes(sequence_prefix_id)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_sequence_prefixes_is_deleted ON treaty_sequence_prefixes(is_deleted)`,

      // product_cobs
      `CREATE INDEX IF NOT EXISTS idx_product_cobs_product_id ON product_cobs(product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_product_cobs_cob_id ON product_cobs(cob_id)`,
      `CREATE INDEX IF NOT EXISTS idx_product_cobs_is_deleted ON product_cobs(is_deleted)`,

      // product_lobs
      `CREATE INDEX IF NOT EXISTS idx_product_lobs_product_id ON product_lobs(product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_product_lobs_lob_id ON product_lobs(lob_id)`,
      `CREATE INDEX IF NOT EXISTS idx_product_lobs_is_deleted ON product_lobs(is_deleted)`,

      // product_master
      `CREATE INDEX IF NOT EXISTS idx_product_master_lob_id ON product_master(lob_id)`,
      `CREATE INDEX IF NOT EXISTS idx_product_master_cob_id ON product_master(cob_id)`,
      `CREATE INDEX IF NOT EXISTS idx_product_master_is_active ON product_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_product_master_is_deleted ON product_master(is_deleted)`,

      // treaty_type_master
      `CREATE INDEX IF NOT EXISTS idx_treaty_type_master_is_active ON treaty_type_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_treaty_type_master_is_deleted ON treaty_type_master(is_deleted)`,

      // workbooks (unmapped columns use the entity's camelCase names)
      `CREATE INDEX IF NOT EXISTS idx_workbooks_month_key ON workbooks("monthKey")`,
      `CREATE INDEX IF NOT EXISTS idx_workbooks_status ON workbooks(status)`,
      `CREATE INDEX IF NOT EXISTS idx_workbooks_is_deleted ON workbooks("isDeleted")`,

      // state_exhibits
      `CREATE INDEX IF NOT EXISTS idx_state_exhibits_workbook_id ON state_exhibits("workbookId")`,
      `CREATE INDEX IF NOT EXISTS idx_state_exhibits_state_code ON state_exhibits("stateCode")`,
      `CREATE INDEX IF NOT EXISTS idx_state_exhibits_is_deleted ON state_exhibits("isDeleted")`,

      // cash_settlements
      `CREATE INDEX IF NOT EXISTS idx_cash_settlements_batch_id ON cash_settlements(batch_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cash_settlements_reinsurer_id ON cash_settlements(reinsurer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cash_settlements_is_deleted ON cash_settlements("isDeleted")`,

      // calculation_report_lines
      `CREATE INDEX IF NOT EXISTS idx_calculation_report_lines_treaty_id ON calculation_report_lines(treaty_id)`,
      `CREATE INDEX IF NOT EXISTS idx_calculation_report_lines_is_deleted ON calculation_report_lines(is_deleted)`,

      // gl_mappings
      `CREATE INDEX IF NOT EXISTS idx_gl_mappings_coa_id ON gl_mappings(coa_id)`,
      `CREATE INDEX IF NOT EXISTS idx_gl_mappings_is_deleted ON gl_mappings(is_deleted)`,

      // chart_of_accounts
      `CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_id ON chart_of_accounts(parent_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_earning_account_id ON chart_of_accounts(earning_account_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_is_active ON chart_of_accounts(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_is_deleted ON chart_of_accounts(is_deleted)`,

      // chart_of_account_documents
      `CREATE INDEX IF NOT EXISTS idx_chart_of_account_documents_coa_id ON chart_of_account_documents(coa_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chart_of_account_documents_is_deleted ON chart_of_account_documents(is_deleted)`,

      // users
      `CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`,
      `CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted)`,

      // user_permissions (checked on every authenticated request)
      `CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_permissions_module_id ON user_permissions(module_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_permissions_submodule_id ON user_permissions(submodule_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id)`,

      // mga_master
      `CREATE INDEX IF NOT EXISTS idx_mga_master_is_active ON mga_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_mga_master_is_deleted ON mga_master(is_deleted)`,

      // carriers (risk companies)
      `CREATE INDEX IF NOT EXISTS idx_carriers_is_active ON carriers(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_carriers_is_deleted ON carriers(is_deleted)`,

      // broker_master
      `CREATE INDEX IF NOT EXISTS idx_broker_master_is_active ON broker_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_broker_master_is_deleted ON broker_master(is_deleted)`,

      // reinsurer_companies
      `CREATE INDEX IF NOT EXISTS idx_reinsurer_companies_is_active ON reinsurer_companies(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_reinsurer_companies_is_deleted ON reinsurer_companies(is_deleted)`,

      // lines_of_business
      `CREATE INDEX IF NOT EXISTS idx_lines_of_business_is_active ON lines_of_business(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_lines_of_business_is_deleted ON lines_of_business(is_deleted)`,

      // cob_master
      `CREATE INDEX IF NOT EXISTS idx_cob_master_is_active ON cob_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_cob_master_is_deleted ON cob_master(is_deleted)`,

      // state_master
      `CREATE INDEX IF NOT EXISTS idx_state_master_is_active ON state_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_state_master_is_deleted ON state_master(is_deleted)`,

      // sequence_prefix_master
      `CREATE INDEX IF NOT EXISTS idx_sequence_prefix_master_is_active ON sequence_prefix_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_sequence_prefix_master_is_deleted ON sequence_prefix_master(is_deleted)`,

      // document_type_master
      `CREATE INDEX IF NOT EXISTS idx_document_type_master_is_active ON document_type_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_document_type_master_is_deleted ON document_type_master(is_deleted)`,

      // contact_domain_master
      `CREATE INDEX IF NOT EXISTS idx_contact_domain_master_mga_id ON contact_domain_master(mga_id)`,
      `CREATE INDEX IF NOT EXISTS idx_contact_domain_master_is_active ON contact_domain_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_contact_domain_master_is_deleted ON contact_domain_master(is_deleted)`,

      // mga_contact_master
      `CREATE INDEX IF NOT EXISTS idx_mga_contact_master_mga_id ON mga_contact_master(mga_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mga_contact_master_is_active ON mga_contact_master(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_mga_contact_master_is_deleted ON mga_contact_master(is_deleted)`,

      // mga_other_names
      `CREATE INDEX IF NOT EXISTS idx_mga_other_names_mga_id ON mga_other_names(mga_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mga_other_names_is_deleted ON mga_other_names(is_deleted)`,

      // broker_documents
      `CREATE INDEX IF NOT EXISTS idx_broker_documents_broker_id ON broker_documents(broker_id)`,
      `CREATE INDEX IF NOT EXISTS idx_broker_documents_document_type_id ON broker_documents(document_type_id)`,
      `CREATE INDEX IF NOT EXISTS idx_broker_documents_is_deleted ON broker_documents(is_deleted)`,

      // mga_documents
      `CREATE INDEX IF NOT EXISTS idx_mga_documents_mga_id ON mga_documents(mga_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mga_documents_is_deleted ON mga_documents(is_deleted)`,

      // state_documents
      `CREATE INDEX IF NOT EXISTS idx_state_documents_state_id ON state_documents(state_id)`,
      `CREATE INDEX IF NOT EXISTS idx_state_documents_is_deleted ON state_documents(is_deleted)`,

      // carrier_documents (risk company documents)
      `CREATE INDEX IF NOT EXISTS idx_carrier_documents_risk_company_id ON carrier_documents(risk_company_id)`,
      `CREATE INDEX IF NOT EXISTS idx_carrier_documents_document_type_id ON carrier_documents(document_type_id)`,
      `CREATE INDEX IF NOT EXISTS idx_carrier_documents_is_deleted ON carrier_documents(is_deleted)`,

      // locked_periods
      `CREATE INDEX IF NOT EXISTS idx_locked_periods_is_locked ON locked_periods(is_locked)`,
      `CREATE INDEX IF NOT EXISTS idx_locked_periods_locked_by ON locked_periods(locked_by)`,
    ];

    for (const sql of indexes) {
      await queryRunner.query(sql);
    }

    const uniqueConstraints: { table: string; name: string; columns: string[] }[] = [
      {
        table: 'treaty_lobs',
        name: 'uq_treaty_lobs_treaty_id_lob_id',
        columns: ['treaty_id', 'lob_id'],
      },
      {
        table: 'treaty_lob_cobs',
        name: 'uq_treaty_lob_cobs_treaty_lob_id_cob_id',
        columns: ['treaty_lob_id', 'cob_id'],
      },
      {
        table: 'treaty_states',
        name: 'uq_treaty_states_treaty_id_state_id',
        columns: ['treaty_id', 'state_id'],
      },
      {
        table: 'treaty_mgas',
        name: 'uq_treaty_mgas_treaty_id_mga_id',
        columns: ['treaty_id', 'mga_id'],
      },
      {
        table: 'product_cobs',
        name: 'uq_product_cobs_product_id_cob_id',
        columns: ['product_id', 'cob_id'],
      },
      {
        table: 'product_lobs',
        name: 'uq_product_lobs_product_id_lob_id',
        columns: ['product_id', 'lob_id'],
      },
      {
        table: 'treaty_products',
        name: 'uq_treaty_products_treaty_id_product_id',
        columns: ['treaty_id', 'product_id'],
      },
      {
        table: 'treaty_itd_totals',
        name: 'uq_treaty_itd_totals_treaty_id_state_id_year_month',
        columns: ['treaty_id', 'state_id', 'year', 'month'],
      },
    ];

    for (const { table, name, columns } of uniqueConstraints) {
      await queryRunner.query(
        `ALTER TABLE ${table} ADD CONSTRAINT ${name} UNIQUE (${columns.join(', ')})`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const uniqueConstraints: { table: string; name: string }[] = [
      { table: 'treaty_lobs', name: 'uq_treaty_lobs_treaty_id_lob_id' },
      { table: 'treaty_lob_cobs', name: 'uq_treaty_lob_cobs_treaty_lob_id_cob_id' },
      { table: 'treaty_states', name: 'uq_treaty_states_treaty_id_state_id' },
      { table: 'treaty_mgas', name: 'uq_treaty_mgas_treaty_id_mga_id' },
      { table: 'product_cobs', name: 'uq_product_cobs_product_id_cob_id' },
      { table: 'product_lobs', name: 'uq_product_lobs_product_id_lob_id' },
      { table: 'treaty_products', name: 'uq_treaty_products_treaty_id_product_id' },
      { table: 'treaty_itd_totals', name: 'uq_treaty_itd_totals_treaty_id_state_id_year_month' },
    ];

    for (const { table, name } of uniqueConstraints) {
      await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${name}`);
    }

    const indexNames: string[] = [
      'idx_journal_entries_batch_id',
      'idx_journal_entries_coa_id',
      'idx_journal_entries_date',
      'idx_journal_entry_batches_treaty_id',
      'idx_journal_entry_batches_month_key',
      'idx_journal_entry_batches_workbook_id',
      'idx_journal_entry_batches_state_code',
      'idx_journal_entry_batches_status',
      'idx_journal_entry_batches_period',
      'idx_journal_entry_batches_is_deleted',
      'idx_journal_entry_drafts_batch_id',
      'idx_journal_entry_drafts_is_deleted',
      'idx_activity_logs_user_id',
      'idx_activity_logs_module_id',
      'idx_activity_logs_submodule_id',
      'idx_activity_logs_action',
      'idx_activity_logs_entity_type',
      'idx_activity_logs_entity_id',
      'idx_activity_logs_created_at',
      'idx_treaties_mga_id',
      'idx_treaties_reinsurer_id',
      'idx_treaties_risk_company_id',
      'idx_treaties_is_active',
      'idx_treaties_is_deleted',
      'idx_treaty_lobs_treaty_id',
      'idx_treaty_lobs_lob_id',
      'idx_treaty_lob_cobs_treaty_lob_id',
      'idx_treaty_lob_cobs_cob_id',
      'idx_treaty_states_treaty_id',
      'idx_treaty_states_state_id',
      'idx_treaty_mgas_treaty_id',
      'idx_treaty_mgas_mga_id',
      'idx_treaty_state_carriers_treaty_id',
      'idx_treaty_state_carriers_risk_company_id',
      'idx_treaty_state_carriers_state_id',
      'idx_treaty_state_carriers_broker_id',
      'idx_treaty_state_carriers_is_deleted',
      'idx_treaty_reinsurers_treaty_id',
      'idx_treaty_reinsurers_reinsurer_id',
      'idx_treaty_reinsurers_state_id',
      'idx_treaty_reinsurers_broker_id',
      'idx_treaty_products_treaty_id',
      'idx_treaty_products_product_id',
      'idx_treaty_products_is_deleted',
      'idx_treaty_itd_totals_treaty_id',
      'idx_treaty_itd_totals_year',
      'idx_treaty_itd_totals_month',
      'idx_treaty_itd_totals_state_id',
      'idx_treaty_itd_totals_is_deleted',
      'idx_treaty_sequence_prefixes_treaty_id',
      'idx_treaty_sequence_prefixes_sequence_prefix_id',
      'idx_treaty_sequence_prefixes_is_deleted',
      'idx_product_cobs_product_id',
      'idx_product_cobs_cob_id',
      'idx_product_cobs_is_deleted',
      'idx_product_lobs_product_id',
      'idx_product_lobs_lob_id',
      'idx_product_lobs_is_deleted',
      'idx_product_master_lob_id',
      'idx_product_master_cob_id',
      'idx_product_master_is_active',
      'idx_product_master_is_deleted',
      'idx_treaty_type_master_is_active',
      'idx_treaty_type_master_is_deleted',
      'idx_workbooks_month_key',
      'idx_workbooks_status',
      'idx_workbooks_is_deleted',
      'idx_state_exhibits_workbook_id',
      'idx_state_exhibits_state_code',
      'idx_state_exhibits_is_deleted',
      'idx_cash_settlements_batch_id',
      'idx_cash_settlements_reinsurer_id',
      'idx_cash_settlements_is_deleted',
      'idx_calculation_report_lines_treaty_id',
      'idx_calculation_report_lines_is_deleted',
      'idx_gl_mappings_coa_id',
      'idx_gl_mappings_is_deleted',
      'idx_chart_of_accounts_parent_id',
      'idx_chart_of_accounts_earning_account_id',
      'idx_chart_of_accounts_is_active',
      'idx_chart_of_accounts_is_deleted',
      'idx_chart_of_account_documents_coa_id',
      'idx_chart_of_account_documents_is_deleted',
      'idx_users_role_id',
      'idx_users_status',
      'idx_users_is_deleted',
      'idx_user_permissions_user_id',
      'idx_user_permissions_module_id',
      'idx_user_permissions_submodule_id',
      'idx_user_permissions_permission_id',
      'idx_mga_master_is_active',
      'idx_mga_master_is_deleted',
      'idx_carriers_is_active',
      'idx_carriers_is_deleted',
      'idx_broker_master_is_active',
      'idx_broker_master_is_deleted',
      'idx_reinsurer_companies_is_active',
      'idx_reinsurer_companies_is_deleted',
      'idx_lines_of_business_is_active',
      'idx_lines_of_business_is_deleted',
      'idx_cob_master_is_active',
      'idx_cob_master_is_deleted',
      'idx_state_master_is_active',
      'idx_state_master_is_deleted',
      'idx_sequence_prefix_master_is_active',
      'idx_sequence_prefix_master_is_deleted',
      'idx_document_type_master_is_active',
      'idx_document_type_master_is_deleted',
      'idx_contact_domain_master_mga_id',
      'idx_contact_domain_master_is_active',
      'idx_contact_domain_master_is_deleted',
      'idx_mga_contact_master_mga_id',
      'idx_mga_contact_master_is_active',
      'idx_mga_contact_master_is_deleted',
      'idx_mga_other_names_mga_id',
      'idx_mga_other_names_is_deleted',
      'idx_broker_documents_broker_id',
      'idx_broker_documents_document_type_id',
      'idx_broker_documents_is_deleted',
      'idx_mga_documents_mga_id',
      'idx_mga_documents_is_deleted',
      'idx_state_documents_state_id',
      'idx_state_documents_is_deleted',
      'idx_carrier_documents_risk_company_id',
      'idx_carrier_documents_document_type_id',
      'idx_carrier_documents_is_deleted',
      'idx_locked_periods_is_locked',
      'idx_locked_periods_locked_by',
    ];

    for (const name of indexNames) {
      await queryRunner.query(`DROP INDEX IF EXISTS ${name}`);
    }
  }
}
