import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../../entities/workbook.entity';
import { StateExhibit } from '../../../entities/state-exhibit.entity';
import { ChartOfAccount } from '../../../entities/chart-of-account.entity';
import { JournalEntryBatch } from '../../../entities/journal-entry-batch.entity';
import { JournalEntry } from '../../../entities/journal-entry.entity';
import { Treaty } from '../../../entities/treaty.entity';
import { WorkbookService } from '../../workbook/services/workbook.service';
import { LossIbnrService } from '../../reserves/services/loss-ibnr.service';
import { LaeIbnrService } from '../../reserves/services/lae-ibnr.service';
import { UlaeIbnrService } from '../../reserves/services/ulae-ibnr.service';

import { LockedPeriod } from '../../../entities/locked-period.entity';

@Injectable()
export class ReportsService {
  constructor(
    private readonly workbookService: WorkbookService,
    private readonly lossIbnrService: LossIbnrService,
    private readonly laeIbnrService: LaeIbnrService,
    private readonly ulaeIbnrService: UlaeIbnrService,
    @InjectRepository(ChartOfAccount)
    private readonly coaRepo: Repository<ChartOfAccount>,
    @InjectRepository(JournalEntryBatch)
    private readonly batchRepo: Repository<JournalEntryBatch>,
    @InjectRepository(JournalEntry)
    private readonly entryRepo: Repository<JournalEntry>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
    @InjectRepository(LockedPeriod)
    private readonly lockedPeriodRepo: Repository<LockedPeriod>,
  ) {}

  async getReinsuranceStatement(workbookId: number, stateCode: string) {
    const workbook = await this.workbookService.findOne(workbookId);
    const prevStateEx = await this.getPreviousStateExhibit(workbook, stateCode);
    const treaty = await this.treatyRepo.findOne({ where: { name: workbook.program } });
    const v = this.calculateCedingValues(workbook, stateCode, prevStateEx, treaty);

    const rateComm = workbook.rates.comm ?? 32.0;
    const rateUlae = workbook.rates.ulae ?? 1.0;
    const rateBoards = workbook.rates.boardsCharge ?? 0.40;
    const rateLossCap = workbook.rates.lossRatioCap ?? 2.0;

    const batchNumber = `RE-${workbook.id}-${stateCode.toUpperCase()}`;
    const batch = await this.batchRepo.findOne({ where: { batchNumber } });
    const isPosted = !!batch;

    return {
      isPosted,
      rows: [
        { label: 'Premiums Written', value: v.premiumWritten, isBold: true },
        { label: 'Change in UEP', value: v.changeUEP, formula: 'Previous UEP - Current UEP' },
        { label: 'Premiums Earned', value: v.premiumsEarned, isBold: true, borderClass: 'single-underline', formula: 'Premiums Written + Change in UEP' },
        { label: 'Less:', isHeader: true },
        { label: `Ceding Commissions at ${rateComm}%`, value: v.cedingCommission, formula: 'Premiums Written * Ceding Commission %' },
        { label: 'Ceding Commissions on UEP', value: v.commissionUEP, formula: 'Change in UEP * Ceding Commission %' },
        { label: 'Ceding Commissions Earned', value: v.commissionEarned, isBold: true, borderClass: 'single-underline', formula: 'Ceding Commissions + Ceding Commissions on UEP' },
        { label: 'Losses Paid (net of salvage & subro)', value: v.lossesPaid },
        { label: 'Change in Loss Reserves', value: v.changeLossReserves, formula: 'Current Loss Reserves - Previous Loss Reserves' },
        { label: 'Change in Loss IBNR Reserves', value: v.changeLossIBNR, formula: 'Ultimate Loss - Losses Paid - Change in Loss Reserves' },
        { label: 'Losses Incurred', value: v.lossesIncurred, isBold: true, borderClass: 'single-underline', formula: 'Losses Paid + Change in Loss Reserves + Change in Loss IBNR' },
        { label: 'Defense and Cost Containment Expense Paid (DCC)', value: v.dccPaid },
        { label: 'Change in DCC Reserves', value: v.changeDCCReserves, formula: 'Current DCC Reserves - Previous DCC Reserves' },
        { label: 'Change in DCC IBNR Reserves', value: v.changeDCCIBNR, formula: 'Ultimate DCC - DCC Paid - Change in DCC Reserves' },
        { label: 'Adjusting & Other Expense Paid (AOE)', value: v.aoePaid },
        { label: 'Change in AOE Reserves', value: v.changeAOEReserves, formula: 'Current AOE Reserves - Previous AOE Reserves' },
        { label: 'Change in AOE IBNR Reserves', value: v.changeAOEIBNR, formula: 'Ultimate AOE - AOE Paid - Change in AOE Reserves' },
        { label: `Unallocated Loss Adjustment Expense at ${rateUlae}%`, value: v.ulaePaid, isBold: true, formula: 'Premiums Written * ULAE Ceding %' },
        { label: 'Change in ULAE IBNR Reserves', value: v.changeULAEIBNR, formula: '(0.5 * Change in Loss Reserves + Change in Loss IBNR) * 0.005' },
        { label: 'Loss Adjustment Expenses Incurred', value: v.laeIncurred, isBold: true, borderClass: 'single-underline', formula: 'DCC Incurred + AOE Incurred + ULAE Incurred' },
        { label: `Boards & Bureaus / ISO Charge at ${rateBoards}%`, value: v.boardsCharge, formula: 'Premiums Written * Boards Charge %' },
        { label: `Boards & Bureaus / ISO Charge at ${rateBoards}% on UEP`, value: v.boardsUEP, formula: 'Change in UEP * Boards Charge %' },
        { label: `Loss Ratio Cap Charge at ${rateLossCap}%`, value: v.lossRatioCap, formula: 'Premiums Written * Loss Ratio Cap %' },
        { label: 'Loss Ratio Cap on UEP', value: v.lossRatioCapUEP, formula: 'Change in UEP * Loss Ratio Cap %' },
        { label: 'Other Expenses Incurred', value: v.otherExpenses, isBold: true, borderClass: 'single-underline', formula: 'Boards Charge + Boards UEP + Loss Ratio Cap + Loss Ratio Cap UEP' },
        { label: 'Total Profit (Loss)', value: v.totalProfit, isBold: true, borderClass: 'double-underline', formula: 'Premiums Earned - Commission Earned - Losses Incurred - LAE Incurred - Other Expenses Incurred' },
        { label: 'Reinsurance Brokerage Fee', value: 0 },
        { label: 'Net Settlement due to/(from) Reinsurer', value: v.netSettlement, isBold: true, borderClass: 'double-underline', formula: 'PW - Ceding Commissions - Losses Paid - DCC Paid - AOE Paid - ULAE Paid - Boards Charge - Loss Ratio Cap' },
        { label: 'Loss Funding', value: 0 },
        { label: 'Net Settlement due from NTA', value: v.netSettlementFuturistic, isBold: true, borderClass: 'double-underline', formula: 'PW - Ceding Commissions - Losses Paid - DCC Paid - AOE Paid - ULAE Paid' },
        { label: 'Fronting Fee @ 5% (paid by separate wire from NTA)', value: v.frontingFee, formula: 'Premiums Written * 5%' },
        { label: 'Fronting Fee on UEP', value: v.frontingFeeUEP, formula: 'Change in UEP * 5%' },
        { label: 'Total Fees Earned - SSIC', value: v.totalFeesEarned, isBold: true, borderClass: 'double-underline', formula: 'Boards Charge + Boards UEP + Loss Ratio Cap + Loss Ratio Cap UEP + Fronting Fee + Fronting Fee UEP' },
        { label: 'Unearned Premium Reserve', value: v.currUEP, isBold: true },
        { label: 'Loss Reserves', value: v.currLossReserves },
        { label: 'Loss IBNR Reserves', value: v.currLossIBNR },
        { label: 'LAE Reserves - DCC', value: v.currDCCReserves },
        { label: 'LAE IBNR Reserves - DCC', value: v.currDCCIBNR },
        { label: 'LAE Reserves - AOE', value: v.currAOEReserves },
        { label: 'LAE IBNR Reserves - AOE', value: v.currAOEIBNR_val },
        { label: 'ULAE IBNR Reserves', value: v.currULAEIBNR },
        { label: 'Loss Pick', value: v.lossPick, isRatio: true },
        { label: 'LAE - DCC', value: v.laeDcc, isRatio: true },
        { label: 'LAE - AOE', value: v.laeAoe, isRatio: true },
        { label: 'Total Loss Pick', value: v.totalLossPick, isRatio: true, isBold: true, borderClass: 'single-underline', formula: 'Loss Pick % + LAE DCC % + LAE AOE %' },
        { label: 'Ultimate Loss', value: v.ultimateLoss, formula: 'Premiums Earned * Loss Pick %' },
        { label: 'Ultimate LAE - DCC', value: v.ultimateLAEDcc, formula: 'Premiums Earned * LAE DCC %' },
        { label: 'Ultimate LAE - AOE', value: v.ultimateLAEAoe, formula: 'Premiums Earned * LAE AOE %' },
        { label: 'Ultimate ULAE', value: v.ultimateULAE, formula: 'ULAE Paid + Change in ULAE IBNR' },
        { label: '', value: v.totalUltimateLossLAE, borderClass: 'single-underline', formula: 'Ultimate Loss + Ultimate DCC + Ultimate AOE + Ultimate ULAE' },
        { label: 'Loss & LAE Reserves (including IBNR)', value: v.lossLAEReserves, isBold: true, borderClass: 'single-underline', formula: 'Loss Reserves + Loss IBNR + DCC Reserves + DCC IBNR + AOE Reserves + AOE IBNR + ULAE IBNR' },
        { label: 'Required Collateral at 115%', value: v.requiredCollateral, isBold: true, borderClass: 'double-underline', formula: 'Loss & LAE Reserves * 1.15' },
      ]
    };
  }

  async getCashSettlementCalculations(workbookId: number, stateCode: string = 'TOTAL') {
    const workbook = await this.workbookService.findOne(workbookId);
    const code = stateCode ? stateCode.toUpperCase() : 'TOTAL';
    let ex = workbook.stateExhibits.find(e => e.stateCode === code);
    if (!ex) {
      ex = workbook.stateExhibits.find(e => e.stateCode === 'TOTAL');
    }
    if (!ex) {
      throw new NotFoundException(`State exhibit ${code} not found in workbook ${workbook.id}`);
    }

    const treaty = await this.treatyRepo.findOne({
      where: { name: workbook.program },
      relations: { reinsurer: true },
    });

    const qsPct = Number(workbook.rates?.qs ?? 100);
    const qShare = qsPct / 100;
    const ssicShare = 1 - qShare;

    const commRate = Number(workbook.rates?.comm ?? 29.0) / 100;
    const cfRate = Number(workbook.rates?.cf ?? 5.0) / 100;
    const bbRate = Number(workbook.rates?.boardsCharge ?? 0.40) / 100;
    const xolRate = Number(workbook.rates?.xol ?? 2.0) / 100;
    const lrCapRate = Number(workbook.rates?.lossRatioCap ?? 0) / 100;

    const reinsurerName = treaty?.reinsurer?.name || 'Starlight Re';

    const getCurVal = (arr: any) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
      if (arr.length > 1) return Number(arr[1] ?? 0);
      return Number(arr[0] ?? 0);
    };

    const getEndVal = (arr: any) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
      if (arr.length > 2) return Number(arr[2] ?? 0);
      if (arr.length > 1) return Number(arr[1] ?? 0);
      return Number(arr[0] ?? 0);
    };

    // 1. Quota Share Premiums Written
    const pw = getCurVal(ex.pw);
    const reins_pw = pw * qShare;
    const ssic_pw = pw * ssicShare;

    // 2. Policy Fees
    const pfw = getCurVal(ex.pfw);
    const reins_pfw = pfw * qShare;
    const ssic_pfw = pfw * ssicShare;

    // 3. Net Premiums Including Policy Fees
    const net_pw = pw + pfw;
    const reins_net_pw = reins_pw + reins_pfw;
    const ssic_net_pw = ssic_pw + ssic_pfw;

    // 4. Collected Premiums
    const pc_raw = getCurVal(ex.pc);
    const pc = pc_raw !== 0 ? pc_raw : pw;
    const reins_pc = pc * qShare;
    const ssic_pc = pc * ssicShare;

    // 5. Policy Fees (Collected)
    const pfc_raw = getCurVal(ex.pfc);
    const pfc = pfc_raw !== 0 ? pfc_raw : pfw;
    const reins_pfc = pfc * qShare;
    const ssic_pfc = pfc * ssicShare;

    // 6. Net Collected Premiums
    const net_pc = pc + pfc;
    const reins_net_pc = reins_pc + reins_pfc;
    const ssic_net_pc = ssic_pc + ssic_pfc;

    // 7. Less: Commission Due
    const comm_due = net_pc * commRate;
    const reins_comm_due = reins_net_pc * commRate;
    const ssic_comm_due = ssic_net_pc * commRate;

    // Less: Policy Fees Commission
    const comm_pf = pfc * commRate;
    const reins_comm_pf = reins_pfc * commRate;
    const ssic_comm_pf = ssic_pfc * commRate;

    // Total Commission Due
    const total_comm_due = comm_due;
    const reins_total_comm_due = reins_comm_due;
    const ssic_total_comm_due = ssic_comm_due;

    // 8. Less: Loss Funding
    const loss_funding = 0;
    const reins_loss_funding = 0;
    const ssic_loss_funding = 0;

    // Less: Losses Paid (net of salvage)
    const lp = getCurVal(ex.lp);
    const reins_lp = lp * qShare;
    const ssic_lp = lp * ssicShare;

    // Less: Unearned Loss Adjustment Expense
    const ulae_paid = 0;
    const reins_ulae_paid = 0;
    const ssic_ulae_paid = 0;

    // Less: Defense and Cost Containment (ALAE)
    const laep = getCurVal(ex.laep);
    const reins_laep = laep * qShare;
    const ssic_laep = laep * ssicShare;

    // Less: Adjusting & Other Expenses Paid
    const ae_paid = getCurVal(ex.ae_paid);
    const reins_ae_paid = ae_paid * qShare;
    const ssic_ae_paid = ae_paid * ssicShare;

    // Total Losses Paid
    const total_losses_paid = lp + laep + ae_paid;
    const reins_total_losses_paid = reins_lp + reins_laep + reins_ae_paid;
    const ssic_total_losses_paid = ssic_lp + ssic_laep + ssic_ae_paid;

    // Subtotal Due
    const subtotal_due = net_pc - total_comm_due - total_losses_paid;
    const reins_subtotal_due = reins_net_pc - reins_total_comm_due - reins_total_losses_paid;
    const ssic_subtotal_due = ssic_net_pc - ssic_total_comm_due - ssic_total_losses_paid;

    // 9. Ceding Fee Due
    const ceding_fee_ssic = net_pc * cfRate;

    // 10. Boards & Bureaus Due
    const bb_due_val = net_pw * bbRate;
    const reins_bb_due = -bb_due_val;
    const ssic_bb_due = bb_due_val;

    // XOL Fees Due
    const xol_due_val = pw * xolRate;
    const reins_xol_due = -xol_due_val;
    const ssic_xol_due = xol_due_val;

    // LR Cap
    const lr_cap_due_val = lrCapRate > 0 ? pw * lrCapRate : 0;
    const reins_lr_cap_due = -lr_cap_due_val;
    const ssic_lr_cap_due = lr_cap_due_val;

    // Total Taxes & Fees Due (SSIC)
    const total_taxes_fees_ssic = ceding_fee_ssic + ssic_bb_due + ssic_xol_due + ssic_lr_cap_due;

    // Total Balance Due Reinsurers
    const reins_total_balance_due = reins_subtotal_due + reins_bb_due + reins_xol_due + reins_lr_cap_due;

    // Total Balance Due SSIC
    const ssic_total_balance_due = total_taxes_fees_ssic;

    // Beginning Balance & Amounts Paid
    const begBal = Number(workbook.cashSettlement?.begBal || 0);
    const amtPaid = Number(workbook.cashSettlement?.amtPaid || 0);
    const ending_bal_ssic = ssic_total_balance_due + begBal - amtPaid;

    // Reserves (Unpaid / Ending)
    const uep = getEndVal(ex.uep);
    const reins_uep = uep * qShare;
    const ssic_uep = uep * ssicShare;

    const loss_reserves = getEndVal(ex.loss_reserves) || getEndVal(ex.lu);
    const reins_loss_reserves = loss_reserves * qShare;
    const ssic_loss_reserves = loss_reserves * ssicShare;

    const lae_reserves = (getEndVal(ex.lae_reserves_dcc) || getEndVal(ex.laeu)) +
                         (getEndVal(ex.lae_reserves_aoe) || getEndVal(ex.aeu));
    const reins_lae_reserves = lae_reserves * qShare;
    const ssic_lae_reserves = lae_reserves * ssicShare;

    const ulae_reserves = getEndVal(ex.ulae_ibnr);
    const reins_ulae_reserves = ulae_reserves * qShare;
    const ssic_ulae_reserves = ulae_reserves * ssicShare;

    const rows = [
      { id: 1, label: '1. QUOTA SHARE PREMIUMS WRITTEN', total: pw, reins: reins_pw, ssic: ssic_pw },
      { id: 2, label: '2. POLICY FEES', total: pfw, reins: reins_pfw, ssic: ssic_pfw },
      { id: 3, label: '3. NET PREMIUMS INCLUDING POLICY FEES', total: net_pw, reins: reins_net_pw, ssic: ssic_net_pw, isBold: true },
      { id: 4, label: '4. COLLECTED PREMIUMS', total: pc, reins: reins_pc, ssic: ssic_pc },
      { id: 5, label: '5. POLICY FEES', total: pfc, reins: reins_pfc, ssic: ssic_pfc },
      { id: 6, label: '6. NET COLLECTED PREMIUMS', total: net_pc, reins: reins_net_pc, ssic: ssic_net_pc, isBold: true },
      { id: 7, label: '7. LESS: COMMISSION DUE', total: comm_due, reins: reins_comm_due, ssic: ssic_comm_due },
      { id: 8, label: 'LESS: POLICY FEES', total: null, reins: null, ssic: null },
      { id: 9, label: 'TOTAL COMMISSION DUE', total: total_comm_due, reins: reins_total_comm_due, ssic: ssic_total_comm_due, isBold: true },
      { id: 10, label: '8. LESS: LOSS FUNDING', total: null, reins: null, ssic: null },
      { id: 11, label: 'LESS: LOSSES PAID (net of salvage)', total: lp, reins: reins_lp, ssic: ssic_lp },
      { id: 12, label: 'LESS: UNEARNED LOSS ADJUSTMENT EXPENSE', total: null, reins: null, ssic: null },
      { id: 13, label: 'LESS: DEFENSE AND COST CONTAINMENT (ALAE)', total: laep, reins: reins_laep, ssic: ssic_laep },
      { id: 14, label: 'LESS: ADJUSTING & OTHER EXPENSES PAID', total: ae_paid, reins: reins_ae_paid, ssic: ssic_ae_paid },
      { id: 15, label: 'TOTAL LOSSES PAID', total: total_losses_paid, reins: reins_total_losses_paid, ssic: ssic_total_losses_paid, isBold: true },
      { id: 16, label: 'SUBTOTAL DUE', total: subtotal_due, reins: reins_subtotal_due, ssic: ssic_subtotal_due, isBold: true, isSubtotal: true },
      { id: 17, label: '9. ceding fee due', total: null, reins: null, ssic: ceding_fee_ssic, ssicColor: 'green' },
      { id: 18, label: '10. BOARDS & BUREAUS DUE', total: null, reins: reins_bb_due, ssic: ssic_bb_due, reinsColor: 'red', ssicColor: 'green' },
      { id: 19, label: 'XOL FEES DUE', total: null, reins: reins_xol_due, ssic: ssic_xol_due, reinsColor: 'red', ssicColor: 'green' },
      { id: 20, label: 'LR Cap', total: null, reins: reins_lr_cap_due, ssic: ssic_lr_cap_due, ssicColor: 'green' },
      { id: 21, label: 'TOTAL TAXES & FEES DUE', total: null, reins: null, ssic: total_taxes_fees_ssic, isBold: true, ssicColor: 'green', ssicUnderline: true },
      { id: 22, label: 'TOTAL BALANCE DUE REINSURERS', total: null, reins: reins_total_balance_due, ssic: null, isBold: true, reinsColor: 'purple' },
      { id: 23, label: 'TOTAL BALANCE DUE SSIC', total: null, reins: null, ssic: ssic_total_balance_due, isBold: true, ssicColor: 'green' },
      { id: 24, label: 'Beginning Balance Due TO/(FROM) SSIC', total: null, reins: null, ssic: begBal, isInput: 'beg_bal' },
      { id: 25, label: 'Less: Amounts Paid TO/(FROM) SSIC', total: null, reins: null, ssic: amtPaid, isInput: 'amt_paid' },
      { id: 26, label: 'Ending Balance Due TO/(FROM) SSIC', total: null, reins: null, ssic: ending_bal_ssic, isBold: true, ssicColor: 'green', ssicUnderline: true },
      { id: 27, label: 'UNEARNED PREMIUM', total: uep, reins: reins_uep, ssic: ssic_uep, isBold: true },
      { id: 28, label: 'OUTSTANDING LOSS RESERVES', total: loss_reserves, reins: reins_loss_reserves, ssic: ssic_loss_reserves, isBold: true },
      { id: 29, label: 'OUTSTANDING LAE RESERVES', total: lae_reserves, reins: reins_lae_reserves, ssic: ssic_lae_reserves, isBold: true },
      { id: 30, label: 'OUTSTANDING ULAE RESERVES', total: ulae_reserves, reins: reins_ulae_reserves, ssic: ssic_ulae_reserves, isBold: true },
    ];

    return {
      qsPct,
      reinsurerName,
      begBal,
      amtPaid,
      beg_bal: begBal,
      amt_paid: amtPaid,
      rows,

      // Backward compatibility fields
      premiumCarrier: ssic_pw,
      premium_carrier: ssic_pw,
      premiumReinsurer: reins_pw,
      premium_reinsurer: reins_pw,
      lossPaidCarrier: ssic_total_losses_paid,
      loss_paid_carrier: ssic_total_losses_paid,
      lossPaidReinsurer: reins_total_losses_paid,
      loss_paid_reinsurer: reins_total_losses_paid,
      netCarrier: ssic_total_balance_due,
      net_carrier: ssic_total_balance_due,
      netReinsurer: reins_total_balance_due,
      net_reinsurer: reins_total_balance_due,
      endingBalance: ending_bal_ssic,
      ending_balance: ending_bal_ssic,
    };
  }

  calculateCedingValues(workbook: Workbook, stateCode: string, prevStateEx: StateExhibit | null, treaty?: Treaty | null) {
    const activeStateEx = workbook.stateExhibits.find(e => e.stateCode === stateCode);
    if (!activeStateEx) {
      throw new NotFoundException(`State exhibit for ${stateCode} not found in workbook ${workbook.id}`);
    }

    const getVal = (ex: StateExhibit, field: string, mode: 'current' | 'cumulative') => {
      const arr = (ex as any)[field];
      if (!arr) return 0;
      const source = ex.workbook?.source || workbook.source;
      if (source === 'FUT') {
        if (mode === 'current') {
          return Number(arr[1] ?? 0);
        } else {
          return Number(arr[2] ?? 0); // YTD / Cumulative
        }
      }
      return Number(arr[1] ?? 0);
    };

    const pw = getVal(activeStateEx, 'pw', 'current');
    const currUEP = getVal(activeStateEx, 'uep', 'current');
    const lossesPaid = getVal(activeStateEx, 'lp', 'current');

    console.log(`[ReportsService] calculateCedingValues for ${stateCode}:`);
    console.log(`  Active exhibit source: ${workbook.source}, has prevStateEx: ${!!prevStateEx}`);
    console.log(`  Active rates: ${JSON.stringify(workbook.rates)}`);
    console.log(`  Active loss_ibnr: ${JSON.stringify(activeStateEx.loss_ibnr)}, lae_ibnr_dcc: ${JSON.stringify(activeStateEx.lae_ibnr_dcc)}, ulae_ibnr: ${JSON.stringify(activeStateEx.ulae_ibnr)}`);
    if (prevStateEx) {
      console.log(`  Prev loss_ibnr: ${JSON.stringify(prevStateEx.loss_ibnr)}, lae_ibnr_dcc: ${JSON.stringify(prevStateEx.lae_ibnr_dcc)}, ulae_ibnr: ${JSON.stringify(prevStateEx.ulae_ibnr)}`);
    }

    const rateComm = workbook.rates.comm ?? 32.0;
    const rateUlae = workbook.rates.ulae ?? 1.0;
    const lossPick = workbook.rates.lossPick ?? 51.8;
    const laeDcc = workbook.rates.laeDcc ?? 6.2;
    const laeAoe = workbook.rates.laeAoe ?? 0.0;
    const rateBoards = workbook.rates.boardsCharge ?? 0.40;
    const rateLossCap = workbook.rates.lossRatioCap ?? 2.0;

    const isDccActive = laeDcc > 0;
    const isAoeActive = laeAoe > 0;

    // Enforce either-or paid claims rule
    let dccPaid = 0;
    let aoePaid = 0;
    if (workbook.source === 'FUT') {
      const rawLaep = getVal(activeStateEx, 'laep', 'current');
      if (isDccActive) {
        dccPaid = rawLaep;
        aoePaid = 0;
      } else if (isAoeActive) {
        aoePaid = rawLaep;
        dccPaid = 0;
      } else {
        dccPaid = 0;
        aoePaid = 0;
      }
    } else {
      const rawLaep = getVal(activeStateEx, 'laep', 'current');
      const rawAePaid = getVal(activeStateEx, 'ae_paid', 'current');
      if (isDccActive) {
        dccPaid = rawLaep + rawAePaid;
        aoePaid = 0;
      } else if (isAoeActive) {
        aoePaid = rawAePaid + rawLaep;
        dccPaid = 0;
      } else {
        dccPaid = 0;
        aoePaid = 0;
      }
    }

    let prevUEP = 0;
    let prevLossReserves = 0;
    let prevLossIBNR = 0;
    let prevDCCReserves = 0;
    let prevDCCIBNR = 0;
    let prevAOEReserves = 0;
    let prevAOEIBNR = 0;
    let prevULAEIBNR = 0;

    if (prevStateEx) {
      prevUEP = getVal(prevStateEx, 'uep', 'cumulative');
      const prevSource = prevStateEx.workbook?.source;

      if (prevSource === 'FUT') {
        const hasPrevDetailedReserves = prevStateEx && (
          (prevStateEx.loss_ibnr && prevStateEx.loss_ibnr.some(v => Number(v) !== 0)) ||
          (prevStateEx.lae_ibnr_dcc && prevStateEx.lae_ibnr_dcc.some(v => Number(v) !== 0)) ||
          (prevStateEx.lae_ibnr_aoe && prevStateEx.lae_ibnr_aoe.some(v => Number(v) !== 0)) ||
          (prevStateEx.ulae_ibnr && prevStateEx.ulae_ibnr.some(v => Number(v) !== 0))
        );

        if (hasPrevDetailedReserves) {
          prevLossReserves = prevStateEx.loss_reserves ? getVal(prevStateEx, 'loss_reserves', 'cumulative') : 0;
          prevLossIBNR = prevStateEx.loss_ibnr ? getVal(prevStateEx, 'loss_ibnr', 'cumulative') : 0;
          prevULAEIBNR = prevStateEx.ulae_ibnr ? getVal(prevStateEx, 'ulae_ibnr', 'cumulative') : 0;

          if (isDccActive) {
            prevDCCReserves = (prevStateEx.lae_reserves_dcc ? getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative') : 0) +
                              (prevStateEx.lae_reserves_aoe ? getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative') : 0);
            prevDCCIBNR = (prevStateEx.lae_ibnr_dcc ? getVal(prevStateEx, 'lae_ibnr_dcc', 'cumulative') : 0) +
                          (prevStateEx.lae_ibnr_aoe ? getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') : 0);
            prevAOEReserves = 0;
            prevAOEIBNR = 0;
          } else if (isAoeActive) {
            prevAOEReserves = (prevStateEx.lae_reserves_aoe ? getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative') : 0) +
                              (prevStateEx.lae_reserves_dcc ? getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative') : 0);
            prevAOEIBNR = (prevStateEx.lae_ibnr_aoe ? getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') : 0) +
                          (prevStateEx.lae_ibnr_dcc ? getVal(prevStateEx, 'lae_ibnr_dcc', 'cumulative') : 0);
            prevDCCReserves = 0;
            prevDCCIBNR = 0;
          } else {
            prevDCCReserves = 0;
            prevDCCIBNR = 0;
            prevAOEReserves = 0;
            prevAOEIBNR = 0;
          }
        } else {
          prevLossReserves = 0;
          prevLossIBNR = prevStateEx.lu ? getVal(prevStateEx, 'lu', 'cumulative') : 0;
          prevULAEIBNR = prevStateEx.aeu ? getVal(prevStateEx, 'aeu', 'cumulative') : 0;

          if (isDccActive) {
            prevDCCReserves = 0;
            prevDCCIBNR = prevStateEx.laeu ? getVal(prevStateEx, 'laeu', 'cumulative') : 0;
            prevAOEReserves = 0;
            prevAOEIBNR = 0;
          } else if (isAoeActive) {
            prevAOEReserves = 0;
            prevAOEIBNR = prevStateEx.laeu ? getVal(prevStateEx, 'laeu', 'cumulative') : 0;
            prevDCCReserves = 0;
            prevDCCIBNR = 0;
          } else {
            prevDCCReserves = 0;
            prevDCCIBNR = 0;
            prevAOEReserves = 0;
            prevAOEIBNR = 0;
          }
        }
      } else {
        prevLossReserves = prevStateEx.loss_reserves ? getVal(prevStateEx, 'loss_reserves', 'cumulative') : 0;
        prevLossIBNR = prevStateEx.loss_ibnr ? getVal(prevStateEx, 'loss_ibnr', 'cumulative') : 0;
        prevULAEIBNR = prevStateEx.ulae_ibnr ? getVal(prevStateEx, 'ulae_ibnr', 'cumulative') : 0;

        if (isDccActive) {
          prevDCCReserves = (prevStateEx.lae_reserves_dcc ? getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative') : 0) +
                            (prevStateEx.lae_reserves_aoe ? getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative') : 0);
          prevDCCIBNR = (prevStateEx.lae_ibnr_dcc ? getVal(prevStateEx, 'lae_ibnr_dcc', 'cumulative') : 0) +
                        (prevStateEx.lae_ibnr_aoe ? getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') : 0);
          prevAOEReserves = 0;
          prevAOEIBNR = 0;
        } else if (isAoeActive) {
          prevAOEReserves = (prevStateEx.lae_reserves_aoe ? getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative') : 0) +
                            (prevStateEx.lae_reserves_dcc ? getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative') : 0);
          prevAOEIBNR = (prevStateEx.lae_ibnr_aoe ? getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') : 0) +
                        (prevStateEx.lae_ibnr_dcc ? getVal(prevStateEx, 'lae_ibnr_dcc', 'cumulative') : 0);
          prevDCCReserves = 0;
          prevDCCIBNR = 0;
        } else {
          prevDCCReserves = 0;
          prevDCCIBNR = 0;
          prevAOEReserves = 0;
          prevAOEIBNR = 0;
        }
      }
    } else if (workbook.source === 'ITD') {
      prevLossReserves = activeStateEx.loss_reserves ? getVal(activeStateEx, 'loss_reserves', 'cumulative') : 0;
      prevLossIBNR = activeStateEx.loss_ibnr ? getVal(activeStateEx, 'loss_ibnr', 'cumulative') : 0;
      prevULAEIBNR = activeStateEx.ulae_ibnr ? getVal(activeStateEx, 'ulae_ibnr', 'cumulative') : 0;

      if (isDccActive) {
        prevDCCReserves = (activeStateEx.lae_reserves_dcc ? getVal(activeStateEx, 'lae_reserves_dcc', 'cumulative') : 0) +
                          (activeStateEx.lae_reserves_aoe ? getVal(activeStateEx, 'lae_reserves_aoe', 'cumulative') : 0);
        prevDCCIBNR = (activeStateEx.lae_ibnr_dcc ? getVal(activeStateEx, 'lae_ibnr_dcc', 'cumulative') : 0) +
                      (activeStateEx.lae_ibnr_aoe ? getVal(activeStateEx, 'lae_ibnr_aoe', 'cumulative') : 0);
        prevAOEReserves = 0;
        prevAOEIBNR = 0;
      } else if (isAoeActive) {
        prevAOEReserves = (activeStateEx.lae_reserves_aoe ? getVal(activeStateEx, 'lae_reserves_aoe', 'cumulative') : 0) +
                          (activeStateEx.lae_reserves_dcc ? getVal(activeStateEx, 'lae_reserves_dcc', 'cumulative') : 0);
        prevAOEIBNR = (activeStateEx.lae_ibnr_aoe ? getVal(activeStateEx, 'lae_ibnr_aoe', 'cumulative') : 0) +
                      (activeStateEx.lae_ibnr_dcc ? getVal(activeStateEx, 'lae_ibnr_dcc', 'cumulative') : 0);
        prevDCCReserves = 0;
        prevDCCIBNR = 0;
      } else {
        prevDCCReserves = 0;
        prevDCCIBNR = 0;
        prevAOEReserves = 0;
        prevAOEIBNR = 0;
      }
    } else if (workbook.source === 'Starlight') {
      prevUEP = Number(activeStateEx.tax[1] || 0);
      prevLossReserves = activeStateEx.loss_reserves ? getVal(activeStateEx, 'loss_reserves', 'cumulative') : 0;
      prevLossIBNR = activeStateEx.loss_ibnr ? getVal(activeStateEx, 'loss_ibnr', 'cumulative') : 0;
      prevULAEIBNR = activeStateEx.ulae_ibnr ? getVal(activeStateEx, 'ulae_ibnr', 'cumulative') : 0;

      if (isDccActive) {
        prevDCCReserves = (activeStateEx.lae_reserves_dcc ? getVal(activeStateEx, 'lae_reserves_dcc', 'cumulative') : 0) +
                          (activeStateEx.lae_reserves_aoe ? getVal(activeStateEx, 'lae_reserves_aoe', 'cumulative') : 0);
        prevDCCIBNR = (activeStateEx.lae_ibnr_dcc ? getVal(activeStateEx, 'lae_ibnr_dcc', 'cumulative') : 0) +
                      (activeStateEx.lae_ibnr_aoe ? getVal(activeStateEx, 'lae_ibnr_aoe', 'cumulative') : 0);
        prevAOEReserves = 0;
        prevAOEIBNR = 0;
      } else if (isAoeActive) {
        prevAOEReserves = (activeStateEx.lae_reserves_aoe ? getVal(activeStateEx, 'lae_reserves_aoe', 'cumulative') : 0) +
                          (activeStateEx.lae_reserves_dcc ? getVal(activeStateEx, 'lae_reserves_dcc', 'cumulative') : 0);
        prevAOEIBNR = (activeStateEx.lae_ibnr_aoe ? getVal(activeStateEx, 'lae_ibnr_aoe', 'cumulative') : 0) +
                      (activeStateEx.lae_ibnr_dcc ? getVal(activeStateEx, 'lae_ibnr_dcc', 'cumulative') : 0);
        prevDCCReserves = 0;
        prevDCCIBNR = 0;
      } else {
        prevDCCReserves = 0;
        prevDCCIBNR = 0;
        prevAOEReserves = 0;
        prevAOEIBNR = 0;
      }
    }

    console.log(`  Computed prev values: lossReserves=${prevLossReserves}, lossIBNR=${prevLossIBNR}, dccReserves=${prevDCCReserves}, dccIBNR=${prevDCCIBNR}, aoeReserves=${prevAOEReserves}, aoeIBNR=${prevAOEIBNR}, ulaeIBNR=${prevULAEIBNR}`);

    const changeUEP = prevUEP - currUEP;
    const premiumsEarned = pw + changeUEP;

    const cedingCommission = pw * (rateComm / 100);
    const commissionUEP = 0.0;
    const commissionEarned = cedingCommission + commissionUEP;

    // Determine if we have direct reserve entries in the current active exhibit
    const hasReserves = getVal(activeStateEx, 'loss_reserves', 'current') !== 0 ||
                        getVal(activeStateEx, 'loss_ibnr', 'current') !== 0 ||
                        getVal(activeStateEx, 'lae_reserves_dcc', 'current') !== 0 ||
                        getVal(activeStateEx, 'lae_ibnr_dcc', 'current') !== 0 ||
                        getVal(activeStateEx, 'lae_reserves_aoe', 'current') !== 0 ||
                        getVal(activeStateEx, 'lae_ibnr_aoe', 'current') !== 0 ||
                        getVal(activeStateEx, 'ulae_ibnr', 'current') !== 0;

    // Also consider reserves present if we have a valid previous workbook with reserve data
    const hasPrevReserves = prevStateEx !== null && (
      getVal(prevStateEx, 'loss_ibnr', 'cumulative') !== 0 ||
      getVal(prevStateEx, 'loss_reserves', 'cumulative') !== 0 ||
      getVal(prevStateEx, 'lae_ibnr_dcc', 'cumulative') !== 0 ||
      getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative') !== 0 ||
      getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') !== 0 ||
      getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative') !== 0 ||
      getVal(prevStateEx, 'ulae_ibnr', 'cumulative') !== 0
    );

    let currLossReserves = 0;
    let currLossIBNR = 0;
    let changeLossReserves = 0;
    let changeLossIBNR = 0;
    let lossesIncurred = 0;

    let currDCCReserves = 0;
    let currDCCIBNR = 0;
    let changeDCCReserves = 0;
    let changeDCCIBNR = 0;
    let dccIncurred = 0;

    let currAOEReserves = 0;
    let currAOEIBNR_val = 0;
    let changeAOEReserves = 0;
    let changeAOEIBNR = 0;
    let aoeIncurred = 0;

    let ulaePaid = 0;
    if (treaty && treaty.ulaeType === 'flat_rate') {
      if (treaty.ulaeFlatAmount !== null && Number(treaty.ulaeFlatAmount) > 0) {
        ulaePaid = Number(treaty.ulaeFlatAmount);
      } else {
        const basis = treaty.ulaeBasis || 'earned_premium';
        if (basis === 'unearned_premium') {
          ulaePaid = currUEP * (rateUlae / 100);
        } else {
          ulaePaid = premiumsEarned * (rateUlae / 100);
        }
      }
    } else {
      ulaePaid = pw * (rateUlae / 100);
    }
    let currULAEIBNR = 0;
    let changeULAEIBNR = 0;
    let ulaeIncurred = 0;

    if (workbook.source === 'FUT') {
      currLossReserves = getVal(activeStateEx, 'lu', 'current');
      if (isDccActive) {
        currDCCReserves = getVal(activeStateEx, 'laeu', 'current') + getVal(activeStateEx, 'aeu', 'current');
        currAOEReserves = 0;
      } else if (isAoeActive) {
        currAOEReserves = getVal(activeStateEx, 'laeu', 'current') + getVal(activeStateEx, 'aeu', 'current');
        currDCCReserves = 0;
      } else {
        currDCCReserves = 0;
        currAOEReserves = 0;
      }

      const ultimateLoss = premiumsEarned * (lossPick / 100);
      const ultimateLAEDcc = premiumsEarned * (laeDcc / 100);
      const ultimateLAEAoe = premiumsEarned * (laeAoe / 100);

      changeLossReserves = currLossReserves - prevLossReserves;
      changeLossIBNR = ultimateLoss - lossesPaid - changeLossReserves;
      currLossIBNR = prevLossIBNR + changeLossIBNR;
      lossesIncurred = lossesPaid + changeLossReserves + changeLossIBNR;

      changeDCCReserves = currDCCReserves - prevDCCReserves;
      changeDCCIBNR = ultimateLAEDcc - dccPaid - changeDCCReserves;
      currDCCIBNR = prevDCCIBNR + changeDCCIBNR;
      dccIncurred = dccPaid + changeDCCReserves + changeDCCIBNR;

      changeAOEReserves = currAOEReserves - prevAOEReserves;
      changeAOEIBNR = ultimateLAEAoe - aoePaid - changeAOEReserves;
      currAOEIBNR_val = prevAOEIBNR + changeAOEIBNR;
      aoeIncurred = aoePaid + changeAOEReserves + changeAOEIBNR;

      changeULAEIBNR = (0.5 * changeLossReserves + changeLossIBNR) * 0.005;
      currULAEIBNR = prevULAEIBNR + changeULAEIBNR;
      ulaeIncurred = ulaePaid + changeULAEIBNR;
    } else if (hasReserves || hasPrevReserves) {
      currLossReserves = getVal(activeStateEx, 'loss_reserves', 'current');
      currLossIBNR = getVal(activeStateEx, 'loss_ibnr', 'current');
      currULAEIBNR = getVal(activeStateEx, 'ulae_ibnr', 'current');

      if (isDccActive) {
        currDCCReserves = getVal(activeStateEx, 'lae_reserves_dcc', 'current') + getVal(activeStateEx, 'lae_reserves_aoe', 'current');
        currDCCIBNR = getVal(activeStateEx, 'lae_ibnr_dcc', 'current') + getVal(activeStateEx, 'lae_ibnr_aoe', 'current');
        currAOEReserves = 0;
        currAOEIBNR_val = 0;
      } else if (isAoeActive) {
        currAOEReserves = getVal(activeStateEx, 'lae_reserves_aoe', 'current') + getVal(activeStateEx, 'lae_reserves_dcc', 'current');
        currAOEIBNR_val = getVal(activeStateEx, 'lae_ibnr_aoe', 'current') + getVal(activeStateEx, 'lae_ibnr_dcc', 'current');
        currDCCReserves = 0;
        currDCCIBNR = 0;
      } else {
        currDCCReserves = 0;
        currDCCIBNR = 0;
        currAOEReserves = 0;
        currAOEIBNR_val = 0;
      }

      changeLossReserves = currLossReserves - prevLossReserves;
      changeLossIBNR = currLossIBNR - prevLossIBNR;
      lossesIncurred = lossesPaid + changeLossReserves + changeLossIBNR;

      changeDCCReserves = currDCCReserves - prevDCCReserves;
      changeDCCIBNR = currDCCIBNR - prevDCCIBNR;
      dccIncurred = dccPaid + changeDCCReserves + changeDCCIBNR;

      changeAOEReserves = currAOEReserves - prevAOEReserves;
      changeAOEIBNR = currAOEIBNR_val - prevAOEIBNR;
      aoeIncurred = aoePaid + changeAOEReserves + changeAOEIBNR;

      changeULAEIBNR = currULAEIBNR - prevULAEIBNR;
      ulaeIncurred = ulaePaid + changeULAEIBNR;
    } else {
      // Use Reserves Module Services
      const lossRes = this.lossIbnrService.calculateLossReserves(premiumsEarned, prevLossIBNR, lossPick);
      const laeRes = this.laeIbnrService.calculateLAEReserves(premiumsEarned, prevDCCIBNR || prevAOEIBNR, laeDcc, laeAoe);
      const ulaeRes = this.ulaeIbnrService.calculateULAEReserves(pw, rateUlae, lossRes.changeLossReserves, lossRes.changeLossIBNR, prevULAEIBNR);

      currLossReserves = 0;
      currLossIBNR = lossRes.currLossIBNR;
      changeLossReserves = lossRes.changeLossReserves;
      changeLossIBNR = lossRes.changeLossIBNR;
      lossesIncurred = lossRes.lossesIncurred;

      ulaePaid = ulaeRes.ulaePaid;
      currULAEIBNR = ulaeRes.currULAEIBNR;
      changeULAEIBNR = ulaeRes.changeULAEIBNR;
      ulaeIncurred = ulaeRes.ulaeIncurred;

      if (isDccActive) {
        currDCCReserves = 0;
        currDCCIBNR = laeRes.currDCCIBNR;
        changeDCCReserves = laeRes.changeDCCReserves;
        changeDCCIBNR = laeRes.changeDCCIBNR;
        dccIncurred = laeRes.dccIncurred;

        currAOEReserves = 0;
        currAOEIBNR_val = 0;
        changeAOEReserves = 0;
        changeAOEIBNR = 0;
        aoeIncurred = 0;
      } else if (isAoeActive) {
        currAOEReserves = 0;
        currAOEIBNR_val = laeRes.currAOEIBNR;
        changeAOEReserves = laeRes.changeAOEReserves;
        changeAOEIBNR = laeRes.changeAOEIBNR;
        aoeIncurred = laeRes.aoeIncurred;

        currDCCReserves = 0;
        currDCCIBNR = 0;
        changeDCCReserves = 0;
        changeDCCIBNR = 0;
        dccIncurred = 0;
      } else {
        currDCCReserves = 0;
        currDCCIBNR = 0;
        changeDCCReserves = 0;
        changeDCCIBNR = 0;
        dccIncurred = 0;

        currAOEReserves = 0;
        currAOEIBNR_val = 0;
        changeAOEReserves = 0;
        changeAOEIBNR = 0;
        aoeIncurred = 0;
      }
    }

    const laeIncurred = dccIncurred + aoeIncurred + ulaeIncurred;

    const boardsCharge = pw * (rateBoards / 100);
    const boardsUEP = changeUEP * (rateBoards / 100);
    const lossRatioCap = pw * (rateLossCap / 100);
    const lossRatioCapUEP = changeUEP * (rateLossCap / 100);
    const otherExpenses = boardsCharge + boardsUEP + lossRatioCap + lossRatioCapUEP;

    const totalProfit = premiumsEarned - commissionEarned - lossesIncurred - laeIncurred - otherExpenses;

    const netSettlement = pw - cedingCommission - lossesPaid - dccPaid - aoePaid - ulaePaid - boardsCharge - lossRatioCap;
    const netSettlementFuturistic = pw - cedingCommission - lossesPaid - dccPaid - aoePaid - ulaePaid;

    const frontingFee = pw * 0.05;
    const frontingFeeUEP = changeUEP * 0.05;
    const totalFeesEarned = boardsCharge + boardsUEP + lossRatioCap + lossRatioCapUEP + frontingFee + frontingFeeUEP;

    const totalLossPick = lossPick + laeDcc + laeAoe;
    const ultimateLoss = lossesIncurred;
    const ultimateLAEDcc = dccIncurred;
    const ultimateLAEAoe = aoeIncurred;
    const ultimateULAE = ulaeIncurred;
    const totalUltimateLossLAE = ultimateLoss + ultimateLAEDcc + ultimateLAEAoe + ultimateULAE;

    const lossLAEReserves = currLossReserves + currLossIBNR + currDCCReserves + currDCCIBNR + currAOEReserves + currAOEIBNR_val + currULAEIBNR;
    const requiredCollateral = lossLAEReserves * 1.15;

    return {
      premiumWritten: pw,
      changeUEP,
      premiumsEarned,
      cedingCommission,
      commissionUEP,
      commissionEarned,
      lossesPaid,
      changeLossReserves,
      changeLossIBNR,
      lossesIncurred,
      dccPaid,
      changeDCCReserves,
      changeDCCIBNR,
      dccIncurred,
      aoePaid,
      changeAOEReserves,
      changeAOEIBNR,
      aoeIncurred,
      ulaePaid,
      changeULAEIBNR,
      ulaeIncurred,
      laeIncurred,
      boardsCharge,
      boardsUEP,
      lossRatioCap,
      lossRatioCapUEP,
      otherExpenses,
      totalProfit,
      netSettlement,
      netSettlementFuturistic,
      frontingFee,
      frontingFeeUEP,
      totalFeesEarned,
      currUEP,
      currLossReserves,
      currLossIBNR,
      currDCCReserves,
      currDCCIBNR,
      currAOEReserves,
      currAOEIBNR_val,
      currULAEIBNR,
      lossPick,
      laeDcc,
      laeAoe,
      totalLossPick,
      ultimateLoss,
      ultimateLAEDcc,
      ultimateLAEAoe,
      ultimateULAE,
      totalUltimateLossLAE,
      lossLAEReserves,
      requiredCollateral,
    };
  }

  private async getPreviousStateExhibit(workbook: Workbook, stateCode: string): Promise<StateExhibit | null> {
    const prevWb = await this.workbookService.findPreviousWorkbookFor(workbook);
    if (!prevWb || !prevWb.stateExhibits) return null;

    let ex = prevWb.stateExhibits.find(e => e.stateCode === stateCode) || null;
    if (ex) {
      ex.workbook = prevWb;
      return ex;
    }

    try {
      const stateRes = await this.coaRepo.query(
        'SELECT state_code, state_abbr FROM state_master WHERE state_abbr = $1 OR state_code::text = $2',
        [stateCode, stateCode]
      );
      if (stateRes.length > 0) {
        const stateObj = stateRes[0];
        const altCode = stateCode === stateObj.state_abbr ? String(stateObj.state_code) : stateObj.state_abbr;
        ex = prevWb.stateExhibits.find(e => String(e.stateCode) === altCode) || null;
      }
    } catch (err) {
      console.error('Error matching state code in getPreviousStateExhibit:', err);
    }

    if (ex) {
      ex.workbook = prevWb;
    }
    return ex;
  }

  private getPreviousMonthKey(monthKey: string): string {
    const parts = monthKey.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  async getGLJournalEntries(workbookId: number, stateCode: string) {
    const workbook = await this.workbookService.findOne(workbookId);
    const prevStateEx = await this.getPreviousStateExhibit(workbook, stateCode);
    const v = this.calculateCedingValues(workbook, stateCode, prevStateEx);

    const GL_MAPPING_SCHEMA_TEMPLATE = [
      { desc: 'Uncollected Premium Direct', account: '120100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.premiumWritten, formulaStr: 'Premiums Written' },
      { desc: 'Direct Premium Written', account: '400100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.premiumWritten, formulaStr: '-Direct Premium Written' },
      { desc: 'Change in Unearned Premium Direct', account: '411100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeUEP, formulaStr: '-Change in UEP' },
      { desc: 'Unearned Premium Direct', account: '230100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeUEP, formulaStr: 'Change in UEP' },
      { desc: 'Ceded Premium Written', account: '400300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.premiumWritten, formulaStr: 'Premiums Written' },
      { desc: 'Ceded Reinsurance Premiums Payable', account: '243100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.premiumWritten, formulaStr: '-Premiums Written' },
      { desc: 'Unearned Premium Ceded', account: '230300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeUEP, formulaStr: '-Change in UEP' },
      { desc: 'Change in Unearned Premium Ceded', account: '411300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeUEP, formulaStr: 'Change in UEP' },
      { desc: 'Commissions Direct', account: '500100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.cedingCommission, formulaStr: 'Ceding Commissions' },
      { desc: 'Uncollected Premium Direct', account: '120100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.cedingCommission, formulaStr: '-Ceding Commissions' },
      { desc: 'Ceded Reinsurance Premiums Payable', account: '243100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.cedingCommission, formulaStr: 'Ceding Commissions' },
      { desc: 'Commissions Ceded', account: '500300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.cedingCommission, formulaStr: '-Ceding Commissions' },
      { desc: 'Direct Losses paid', account: '600100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.lossesPaid, formulaStr: 'Losses Paid' },
      { desc: 'Payable to MGA', account: '264400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.lossesPaid, formulaStr: '-Losses Paid' },
      { desc: 'Amounts recoverable from reinsurers', account: '125100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.lossesPaid, formulaStr: 'Losses Paid' },
      { desc: 'Ceded Losses Paid', account: '600300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.lossesPaid, formulaStr: '-Losses Paid' },
      { desc: 'Change in Case Loss Reserves - Direct', account: '550100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeLossReserves, formulaStr: 'Change in Loss Reserves' },
      { desc: 'Case Loss Reserves - Direct', account: '200100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeLossReserves, formulaStr: '-Change in Loss Reserves' },
      { desc: 'Case Loss Reserves - Ceded', account: '200300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeLossReserves, formulaStr: 'Change in Loss Reserves' },
      { desc: 'Change in Case Loss Reserves - Ceded', account: '550300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeLossReserves, formulaStr: '-Change in Loss Reserves' },
      { desc: 'Change in IBNR Loss Reserves - Direct', account: '550400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeLossIBNR, formulaStr: 'Change in Loss IBNR' },
      { desc: 'IBNR Loss Reserves - Direct', account: '200400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeLossIBNR, formulaStr: '-Change in Loss IBNR' },
      { desc: 'IBNR Loss Reserves - Ceded', account: '200600', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeLossIBNR, formulaStr: 'Change in Loss IBNR' },
      { desc: 'Change in IBNR Loss Reserves - Ceded', account: '550600', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeLossIBNR, formulaStr: '-Change in Loss IBNR' },
      { desc: 'Direct LAE DCC Paid', account: '601100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.dccPaid, formulaStr: 'DCC Paid' },
      { desc: 'Payable to MGA', account: '264400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.dccPaid, formulaStr: '-DCC Paid' },
      { desc: 'Amounts recoverable from reinsurers', account: '125100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.dccPaid, formulaStr: 'DCC Paid' },
      { desc: 'Ceded LAE DCC Paid', account: '601300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.dccPaid, formulaStr: '-DCC Paid' },
      { desc: 'Change in LAE DCC Reserves - Direct', account: '557100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeDCCReserves, formulaStr: 'Change in DCC Reserves' },
      { desc: 'LAE DCC Reserves - Direct', account: '207100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeDCCReserves, formulaStr: '-Change in DCC Reserves' },
      { desc: 'LAE DCC Reserves - Ceded', account: '207300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeDCCReserves, formulaStr: 'Change in DCC Reserves' },
      { desc: 'Change in LAE DCC Reserves - Ceded', account: '557300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeDCCReserves, formulaStr: '-Change in DCC Reserves' },
      { desc: 'Change in IBNR DCC Reserves - Direct', account: '557400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeDCCIBNR, formulaStr: 'Change in DCC IBNR' },
      { desc: 'IBNR DCC Reserves - Direct', account: '207400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeDCCIBNR, formulaStr: '-Change in DCC IBNR' },
      { desc: 'IBNR DCC Reserves - Ceded', account: '207600', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeDCCIBNR, formulaStr: 'Change in DCC IBNR' },
      { desc: 'Change in IBNR DCC Reserves - Ceded', account: '557600', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeDCCIBNR, formulaStr: '-Change in DCC IBNR' },
      { desc: 'Direct LAE A&O Paid', account: '602100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.aoePaid, formulaStr: 'AOE Paid' },
      { desc: 'Payable to MGA', account: '264400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.aoePaid, formulaStr: '-AOE Paid' },
      { desc: 'Amounts recoverable from reinsurers', account: '125100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.aoePaid, formulaStr: 'AOE Paid' },
      { desc: 'Ceded LAE A&O Paid', account: '602300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.aoePaid, formulaStr: '-AOE Paid' },
      { desc: 'Change in LAE A&O Reserves - Direct', account: '558100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeAOEReserves, formulaStr: 'Change in AOE Reserves' },
      { desc: 'LAE A&O Reserves - Direct', account: '208100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeAOEReserves, formulaStr: '-Change in AOE Reserves' },
      { desc: 'LAE A&O Reserves - Ceded', account: '208300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeAOEReserves, formulaStr: 'Change in AOE Reserves' },
      { desc: 'Change in LAE A&O Reserves - Ceded', account: '558300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeAOEReserves, formulaStr: '-Change in AOE Reserves' },
      { desc: 'Change in IBNR A&O Reserves - Direct', account: '558400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeAOEIBNR, formulaStr: 'Change in AOE IBNR' },
      { desc: 'IBNR A&O Reserves - Direct', account: '208400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeAOEIBNR, formulaStr: '-Change in AOE IBNR' },
      { desc: 'IBNR A&O Reserves - Ceded', account: '208600', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeAOEIBNR, formulaStr: 'Change in AOE IBNR' },
      { desc: 'Change in IBNR A&O Reserves - Ceded', account: '558600', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeAOEIBNR, formulaStr: '-Change in AOE IBNR' },
      { desc: 'Direct ULAE Paid', account: '603100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.ulaePaid, formulaStr: 'ULAE Paid' },
      { desc: 'Payable to MGA', account: '264400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.ulaePaid, formulaStr: '-ULAE Paid' },
      { desc: 'Amounts recoverable from reinsurers', account: '125100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.ulaePaid, formulaStr: 'ULAE Paid' },
      { desc: 'Ceded ULAE Paid', account: '603300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.ulaePaid, formulaStr: '-ULAE Paid' },
      { desc: 'Change in IBNR ULAE Reserves - Direct', account: '559400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeULAEIBNR, formulaStr: 'Change in ULAE IBNR' },
      { desc: 'IBNR ULAE Reserves - Direct', account: '209400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeULAEIBNR, formulaStr: '-Change in ULAE IBNR' },
      { desc: 'IBNR ULAE Reserves - Ceded', account: '209600', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.changeULAEIBNR, formulaStr: 'Change in ULAE IBNR' },
      { desc: 'Change in IBNR ULAE Reserves - Ceded', account: '559600', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.changeULAEIBNR, formulaStr: '-Change in ULAE IBNR' },
      { desc: 'Other amounts recoverable from reinsurers', account: '127100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.boardsCharge, formulaStr: 'Boards Charge' },
      { desc: 'Commissions Ceded', account: '500300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.boardsCharge, formulaStr: '-Boards Charge' },
      { desc: 'Commissions Ceded', account: '500300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.boardsUEP, formulaStr: '-Boards UEP' },
      { desc: 'Deferred Ceding Commissions', account: '243200', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.boardsUEP, formulaStr: 'Boards UEP' },
      { desc: 'Ceded Reinsurance Premiums Payable', account: '243100', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.lossRatioCap, formulaStr: 'Loss Ratio Cap Charge' },
      { desc: 'Commissions Ceded', account: '500300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.lossRatioCap, formulaStr: '-Loss Ratio Cap Charge' },
      { desc: 'Commissions Ceded', account: '500300', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.lossRatioCapUEP, formulaStr: '-Loss Ratio Cap UEP' },
      { desc: 'Deferred Ceding Commissions', account: '243200', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.lossRatioCapUEP, formulaStr: 'Loss Ratio Cap UEP' },
      { desc: 'Receivable from MGA', account: '160400', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.frontingFee, formulaStr: 'Fronting Fee' },
      { desc: 'Fronting Fees', account: '500110', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.frontingFee, formulaStr: '-Fronting Fee' },
      { desc: 'Fronting Fees', account: '500110', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: 'state', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => -vals.frontingFeeUEP, formulaStr: '-Fronting Fee UEP' },
      { desc: 'Deferred Ceding Commissions', account: '243200', cc: workbook.cc, mga: workbook.mga, lob: workbook.lob, st: '00', ext: workbook.ext, sub: workbook.sub, lineDesc: workbook.lineDescSuffix, formula: (vals: any) => vals.frontingFeeUEP, formulaStr: 'Fronting Fee UEP' }
    ];

    const rows: any[] = [];
    GL_MAPPING_SCHEMA_TEMPLATE.forEach(schema => {
      let val = schema.formula(v);
      val = Math.round(val * 100) / 100;
      if (val === 0) return;

      const st = schema.st === 'state' ? stateCode : schema.st;

      rows.push({
        desc: schema.desc,
        comp: workbook.comp,
        account: schema.account,
        cc: schema.cc,
        mga: schema.mga,
        lob: schema.lob,
        st,
        ext: schema.ext,
        sub: schema.sub,
        lineDesc: schema.lineDesc,
        debit: val > 0 ? val : 0,
        credit: val < 0 ? Math.abs(val) : 0,
        formula: schema.formulaStr,
      });
    });
    return rows;
  }

  async postToJournalEntries(workbookId: number, stateCode: string, userId?: string, customRows?: any[]) {
    const workbook = await this.workbookService.findOne(workbookId);
    const locked = await this.lockedPeriodRepo.findOne({ where: { period: workbook.monthLabel, isLocked: true } });
    if (locked) {
      throw new BadRequestException(`Accounting period '${workbook.monthLabel}' is locked. Cannot post entries.`);
    }
    let glRows = await this.getGLJournalEntries(workbookId, stateCode);

    if (customRows && Array.isArray(customRows)) {
      glRows = customRows;
    }

    if (glRows.length === 0) {
      throw new BadRequestException('No journal entries generated for this workbook/state combination.');
    }

    await this.workbookService.updateStatus(workbookId, 'Approved');

    const batchNumber = `RE-${workbook.id}-${stateCode.toUpperCase()}`;
    let batch = await this.batchRepo.findOne({ where: { batchNumber } });

    let agentName = workbook.program;
    const treatyRows = await this.coaRepo.query(
      'SELECT mga_id FROM treaties WHERE name = $1',
      [workbook.program]
    );
    if (treatyRows && treatyRows.length > 0 && treatyRows[0].mga_id) {
      const mgaRows = await this.coaRepo.query(
        'SELECT name FROM mga_master WHERE id = $1',
        [treatyRows[0].mga_id]
      );
      if (mgaRows && mgaRows.length > 0) {
        agentName = mgaRows[0].name;
      }
    }

    if (batch) {
      await this.entryRepo.delete({ batchId: batch.id });
      batch.agentName = agentName;
      await this.batchRepo.save(batch);
    } else {
      batch = this.batchRepo.create({
        batchNumber,
        period: workbook.monthLabel,
        agentName,
        totalAmount: 0,
        count: 0,
        createdBy: userId || null,
      });
      batch = await this.batchRepo.save(batch);
    }

    const entries: JournalEntry[] = [];
    const today = new Date().toISOString().split('T')[0];
    const coaList = await this.coaRepo.find();

    for (let i = 0; i < glRows.length; i++) {
      const row = glRows[i];
      const accountCodeNum = parseInt(row.account);
      const coa = coaList.find(c => c.accountCode === accountCodeNum);

      if (!coa) {
        throw new BadRequestException(`Chart of Account with code ${row.account} does not exist. Please seed it first.`);
      }

      const entry = this.entryRepo.create({
        batchId: batch.id,
        jeNumber: 1,
        description: row.desc,
        coaId: coa.id,
        sub: row.sub || null,
        debit: row.debit > 0 ? row.debit : null,
        credit: row.credit > 0 ? row.credit : null,
        date: today,
        dp: '-',
        policy: row.lineDesc,
        memo: `Auto-generated from Reinsurance Statement ${workbook.program} ${workbook.monthLabel} (${stateCode})`,
      });
      entries.push(entry);
    }

    await this.entryRepo.save(entries);

    const totalAmount = glRows.reduce((sum, r) => sum + Number(r.debit || 0), 0);
    batch.totalAmount = Math.round(totalAmount * 100) / 100;
    batch.count = 1;
    await this.batchRepo.save(batch);

    return batch;
  }

  async uploadToBatch(batchId: string, buffer: Buffer, originalname: string, program?: string) {
    const uploadResult = await this.workbookService.uploadWorkbook(buffer, originalname, true, program);
    const workbookId = uploadResult.workbook.id;

    const manualBatch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!manualBatch) {
      throw new NotFoundException(`Journal Batch with ID ${batchId} not found`);
    }

    const glRows = await this.getGLJournalEntries(workbookId, 'TOTAL');
    if (glRows.length === 0) {
      throw new BadRequestException('No journal entries generated for this workbook.');
    }

    await this.entryRepo.delete({ batchId });

    const entries: JournalEntry[] = [];
    const today = new Date().toISOString().split('T')[0];
    const coaList = await this.coaRepo.find();

    for (let i = 0; i < glRows.length; i++) {
      const row = glRows[i];
      const accountCodeNum = parseInt(row.account);
      const coa = coaList.find(c => c.accountCode === accountCodeNum);

      if (!coa) {
        throw new BadRequestException(`Chart of Account with code ${row.account} does not exist. Please seed it first.`);
      }

      const entry = this.entryRepo.create({
        batchId,
        jeNumber: 1,
        description: row.desc,
        coaId: coa.id,
        sub: row.sub || null,
        debit: row.debit > 0 ? row.debit : null,
        credit: row.credit > 0 ? row.credit : null,
        date: today,
        dp: '-',
        policy: row.lineDesc,
        memo: `Uploaded from Reinsurance Workbook ${originalname}`,
      });
      entries.push(entry);
    }

    await this.entryRepo.save(entries);

    const totalAmount = glRows.reduce((sum, r) => sum + Number(r.debit || 0), 0);
    manualBatch.totalAmount = Math.round(totalAmount * 100) / 100;
    manualBatch.count = 1;
    await this.batchRepo.save(manualBatch);

    return {
      success: true,
      batch: manualBatch,
      entries,
    };
  }
}
