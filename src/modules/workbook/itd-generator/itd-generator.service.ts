import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ParsingHelpersService } from '../parsing-helpers/parsing-helpers.service';

/** Generates an ITD-baseline XLSX workbook (one MTHLY-XX sheet per state plus MTHLY-TOTAL) from a Starlight summary workbook, used to seed the database before month-over-month FUT uploads. */
@Injectable()
export class ItdGeneratorService {
  constructor(private readonly helpers: ParsingHelpersService) {}

  generateITDWorkbookFromStarlight(fileBuffer: Buffer): Buffer {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    const summarySheetName =
      sheetNames.find(name => name === 'Starlight Excess' || name === 'Starlight APD') ??
      sheetNames.find(name => name.toLowerCase().includes('starlight')) ??
      sheetNames[0];

    const summarySheet = workbook.Sheets[summarySheetName];
    if (!summarySheet) {
      throw new BadRequestException('Invalid Starlight summary sheet');
    }

    const pwRow = this.helpers.findRowIndexByLabel(summarySheet, 'Premiums Written');
    const uepRow = this.helpers.findRowIndexByLabel(summarySheet, 'Unearned Premium Reserve');
    const lossReservesRow = this.helpers.findRowIndexByLabel(summarySheet, 'Loss Reserves');
    const lossIbnrRow = this.helpers.findRowIndexByLabel(summarySheet, 'Loss IBNR Reserves');
    const dccReservesRow = this.helpers.findRowIndexByLabel(summarySheet, 'LAE Reserves - DCC');
    const dccIbnrRow = this.helpers.findRowIndexByLabel(summarySheet, 'LAE IBNR Reserves - DCC');
    const aoeReservesRow = this.helpers.findRowIndexByLabel(summarySheet, 'LAE Reserves - AOE');
    const aoeIbnrRow = this.helpers.findRowIndexByLabel(summarySheet, 'LAE IBNR Reserves - AOE');
    const ulaeIbnrRow = this.helpers.findRowIndexByLabel(summarySheet, 'ULAE IBNR Reserves');

    const lpRow = this.helpers.findRowIndexByLabel(summarySheet, 'Losses Paid');
    const dccPaidRow = this.helpers.findRowIndexByLabel(
      summarySheet,
      'Defense and Cost Containment Expense Paid',
    );
    const aoePaidRow = this.helpers.findRowIndexByLabel(
      summarySheet,
      'Adjusting & Other Expense Paid',
    );

    const itdColIdx = 2; // Column C

    const outWb = XLSX.utils.book_new();

    // 1. Process and append MTHLY-TOTAL first using the summary sheet
    const total_pw = this.helpers.getNumericValue(summarySheet, pwRow, itdColIdx);
    const total_uep = this.helpers.getNumericValue(summarySheet, uepRow, itdColIdx);
    const total_loss_reserves = this.helpers.getNumericValue(
      summarySheet,
      lossReservesRow,
      itdColIdx,
    );
    const total_loss_ibnr = this.helpers.getNumericValue(summarySheet, lossIbnrRow, itdColIdx);
    const total_lae_reserves_dcc = this.helpers.getNumericValue(
      summarySheet,
      dccReservesRow,
      itdColIdx,
    );
    const total_lae_ibnr_dcc = this.helpers.getNumericValue(summarySheet, dccIbnrRow, itdColIdx);
    const total_lae_reserves_aoe = this.helpers.getNumericValue(
      summarySheet,
      aoeReservesRow,
      itdColIdx,
    );
    const total_lae_ibnr_aoe = this.helpers.getNumericValue(summarySheet, aoeIbnrRow, itdColIdx);
    const total_ulae_ibnr = this.helpers.getNumericValue(summarySheet, ulaeIbnrRow, itdColIdx);

    const total_lp = this.helpers.getNumericValue(summarySheet, lpRow, itdColIdx);
    const total_laep = this.helpers.getNumericValue(summarySheet, dccPaidRow, itdColIdx);
    const total_ae_paid = this.helpers.getNumericValue(summarySheet, aoePaidRow, itdColIdx);

    const total_lu = total_loss_reserves + total_loss_ibnr;
    const total_laeu = total_lae_reserves_dcc + total_lae_ibnr_dcc;
    const total_aeu = total_lae_reserves_aoe + total_lae_ibnr_aoe + total_ulae_ibnr;

    const totalItdValues = {
      pw: total_pw,
      pfw: 0,
      pc: total_pw,
      pfc: 0,
      tax: 0,
      lp: total_lp,
      laep: total_laep,
      ae_paid: total_ae_paid,
      pe: total_pw - total_uep,
      pfe: 0,
      uep: total_uep,
      lu: total_lu,
      laeu: total_laeu,
      aeu: total_aeu,
      loss_reserves: total_loss_reserves,
      loss_ibnr: total_loss_ibnr,
      lae_reserves_dcc: total_lae_reserves_dcc,
      lae_ibnr_dcc: total_lae_ibnr_dcc,
      lae_reserves_aoe: total_lae_reserves_aoe,
      lae_ibnr_aoe: total_lae_ibnr_aoe,
      ulae_ibnr: total_ulae_ibnr,
    };

    const totalWs = this.createITDStateSheet('MTHLY-TOTAL', totalItdValues);
    XLSX.utils.book_append_sheet(outWb, totalWs, 'MTHLY-TOTAL');

    // 2. Process all state sheets
    for (const sheetName of sheetNames) {
      const cleanName = sheetName.trim();
      const isState = cleanName.length === 2;

      if (isState) {
        const stateSheet = workbook.Sheets[sheetName];
        if (!stateSheet) continue;

        const pw = this.helpers.getNumericValue(stateSheet, pwRow, itdColIdx);
        const uep = this.helpers.getNumericValue(stateSheet, uepRow, itdColIdx);

        const loss_reserves = this.helpers.getNumericValue(stateSheet, lossReservesRow, itdColIdx);
        const loss_ibnr = this.helpers.getNumericValue(stateSheet, lossIbnrRow, itdColIdx);
        const lae_reserves_dcc = this.helpers.getNumericValue(
          stateSheet,
          dccReservesRow,
          itdColIdx,
        );
        const lae_ibnr_dcc = this.helpers.getNumericValue(stateSheet, dccIbnrRow, itdColIdx);
        const lae_reserves_aoe = this.helpers.getNumericValue(
          stateSheet,
          aoeReservesRow,
          itdColIdx,
        );
        const lae_ibnr_aoe = this.helpers.getNumericValue(stateSheet, aoeIbnrRow, itdColIdx);
        const ulae_ibnr = this.helpers.getNumericValue(stateSheet, ulaeIbnrRow, itdColIdx);

        const lp = this.helpers.getNumericValue(stateSheet, lpRow, itdColIdx);
        const laep = this.helpers.getNumericValue(stateSheet, dccPaidRow, itdColIdx);
        const ae_paid = this.helpers.getNumericValue(stateSheet, aoePaidRow, itdColIdx);

        const lu = loss_reserves + loss_ibnr;
        const laeu = lae_reserves_dcc + lae_ibnr_dcc;
        const aeu = lae_reserves_aoe + lae_ibnr_aoe + ulae_ibnr;

        const itdValues = {
          pw,
          pfw: 0,
          pc: pw,
          pfc: 0,
          tax: 0,
          lp,
          laep,
          ae_paid,
          pe: pw - uep,
          pfe: 0,
          uep,
          lu,
          laeu,
          aeu,
          loss_reserves,
          loss_ibnr,
          lae_reserves_dcc,
          lae_ibnr_dcc,
          lae_reserves_aoe,
          lae_ibnr_aoe,
          ulae_ibnr,
        };

        const targetSheetName = `MTHLY-${cleanName.toUpperCase()}`;
        const ws = this.createITDStateSheet(targetSheetName, itdValues);
        XLSX.utils.book_append_sheet(outWb, ws, targetSheetName);
      }
    }

    return XLSX.write(outWb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private createITDStateSheet(
    sheetName: string,
    itdValues: Record<string, number>,
  ): XLSX.WorkSheet {
    const data: Array<Array<string | number | null>> = [];
    for (let i = 0; i < 13; i++) {
      data.push([]);
    }
    data[3] = ['FOR THE MONTH OF', null, 'Dec-25'];
    data[11] = ['TREATY YEAR :  5/1/2020', 'Inland Marine', 'Auto Liab', 'Phys. Damage', 'TOTALS'];

    const FIELDS_LABELS = {
      pw: 'Premiums Written',
      pfw: 'Policy Fees Written',
      pc: 'Premiums Collected',
      pfc: 'Policy Fees Collected',
      tax: 'Premium Taxes',
      lp: 'Losses Paid (Net of Salvage & Subrogation)',
      laep: 'Defense & Cost Containment Expenses Paid - (ALAE)',
      ae_paid: 'Adjusting & Other Expenses Paid - (ULAE-TPA Fees)',
      pe: 'Premium Earned - YTD',
      pfe: 'Policy Fees Earned - YTD',
      uep: 'Unearned Premium Reserves ',
      lu: 'Direct Losses Unpaid ',
      laeu: 'Defense & Cost Containment Unpaid - (ALAE)',
      aeu: 'Adjusting & Other Unpaid - (ULAE-TPA Fees)',
      loss_reserves: 'Loss Reserves / Case Reserves',
      loss_ibnr: 'Loss IBNR Reserves',
      lae_reserves_dcc: 'LAE Reserves - DCC',
      lae_ibnr_dcc: 'LAE IBNR Reserves - DCC',
      lae_reserves_aoe: 'LAE Reserves - AOE',
      lae_ibnr_aoe: 'LAE IBNR Reserves - AOE',
      ulae_ibnr: 'ULAE IBNR Reserves',
    };

    const FIELDS = [
      'pw',
      'pfw',
      'pc',
      'pfc',
      'tax',
      'lp',
      'laep',
      'ae_paid',
      'pe',
      'pfe',
      'uep',
      'lu',
      'laeu',
      'aeu',
      'loss_reserves',
      'loss_ibnr',
      'lae_reserves_dcc',
      'lae_ibnr_dcc',
      'lae_reserves_aoe',
      'lae_ibnr_aoe',
      'ulae_ibnr',
    ];

    FIELDS.forEach(fieldId => {
      const val = itdValues[fieldId] || 0;
      const label = FIELDS_LABELS[fieldId as keyof typeof FIELDS_LABELS];
      data.push([label, 0, 0, val, 0]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['C4'] = { t: 's', v: 'Dec-25' };
    return ws;
  }
}
