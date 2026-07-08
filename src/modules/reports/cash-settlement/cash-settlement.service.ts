import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkbooksService } from '../../workbook/workbooks/workbooks.service';
import { StateExhibit } from '../../workbook/entities/state-exhibit.entity';
import { Workbook } from '../../workbook/entities/workbook.entity';
import { Treaty } from '../../masters/entities/treaty.entity';
import { CashSettlementDao } from './dao/cash-settlement.dao';

const getCurVal = (arr: number[] | null | undefined) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
  if (arr.length > 1) return Number(arr[1] ?? 0);
  return Number(arr[0] ?? 0);
};

const getEndVal = (arr: number[] | null | undefined) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
  if (arr.length > 2) return Number(arr[2] ?? 0);
  if (arr.length > 1) return Number(arr[1] ?? 0);
  return Number(arr[0] ?? 0);
};

/** Computes the cash settlement calculation report (quota share splits, commissions, losses, fees, and reserves) for a workbook state exhibit. */
@Injectable()
export class CashSettlementService {
  constructor(
    private readonly dao: CashSettlementDao,
    private readonly workbooksService: WorkbooksService,
  ) {}

  async getCashSettlementCalculations(workbookId: number, stateCode: string = 'TOTAL') {
    const workbook = await this.workbooksService.findOne(workbookId);
    const ex = this.resolveStateExhibit(workbook, stateCode);
    const treaty = await this.dao.findTreatyByProgramWithReinsurer(workbook.program);
    const rates = this.resolveRates(workbook, treaty);

    const premiums = this.calculatePremiums(ex, rates.qShare, rates.ssicShare);
    const lossesAndComm = this.calculateCommissionsAndLosses(ex, premiums, rates);
    const feesAndBalances = this.calculateFeesAndBalances(workbook, premiums, lossesAndComm, rates);
    const reserves = this.calculateReserves(ex, rates.qShare, rates.ssicShare);

    const rows = this.buildRows(premiums, lossesAndComm, feesAndBalances, reserves);

    return {
      qsPct: rates.qsPct,
      reinsurerName: rates.reinsurerName,
      begBal: feesAndBalances.begBal,
      amtPaid: feesAndBalances.amtPaid,
      beg_bal: feesAndBalances.begBal,
      amt_paid: feesAndBalances.amtPaid,
      rows,

      // Backward compatibility fields
      premiumCarrier: premiums.ssic_pw,
      premium_carrier: premiums.ssic_pw,
      premiumReinsurer: premiums.reins_pw,
      premium_reinsurer: premiums.reins_pw,
      lossPaidCarrier: lossesAndComm.ssic_total_losses_paid,
      loss_paid_carrier: lossesAndComm.ssic_total_losses_paid,
      lossPaidReinsurer: lossesAndComm.reins_total_losses_paid,
      loss_paid_reinsurer: lossesAndComm.reins_total_losses_paid,
      netCarrier: feesAndBalances.ssic_total_balance_due,
      net_carrier: feesAndBalances.ssic_total_balance_due,
      netReinsurer: feesAndBalances.reins_total_balance_due,
      net_reinsurer: feesAndBalances.reins_total_balance_due,
      endingBalance: feesAndBalances.ending_bal_ssic,
      ending_balance: feesAndBalances.ending_bal_ssic,
    };
  }

  private resolveStateExhibit(workbook: Workbook, stateCode: string): StateExhibit {
    const code = stateCode ? stateCode.toUpperCase() : 'TOTAL';
    let ex = workbook.stateExhibits.find(e => e.stateCode === code);
    ex ??= workbook.stateExhibits.find(e => e.stateCode === 'TOTAL');
    if (!ex) {
      throw new NotFoundException(`State exhibit ${code} not found in workbook ${workbook.id}`);
    }
    return ex;
  }

  private resolveRates(workbook: Workbook, treaty: Treaty | null) {
    const qsPct = Number(workbook.rates?.qs ?? 100);
    const qShare = qsPct / 100;
    const ssicShare = 1 - qShare;

    const commRate = Number(workbook.rates?.comm ?? 29.0) / 100;
    const cfRate = Number(workbook.rates?.cf ?? 5.0) / 100;
    const bbRate = Number(workbook.rates?.boardsCharge ?? 0.4) / 100;
    const xolRate = Number(workbook.rates?.xol ?? 2.0) / 100;
    const lrCapRate = Number(workbook.rates?.lossRatioCap ?? 0) / 100;

    const reinsurerName = treaty?.treatyReinsurers?.[0]?.reinsurer?.name ?? 'Starlight Re';

    return {
      qsPct,
      qShare,
      ssicShare,
      commRate,
      cfRate,
      bbRate,
      xolRate,
      lrCapRate,
      reinsurerName,
    };
  }

  private calculatePremiums(ex: StateExhibit, qShare: number, ssicShare: number) {
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

    return {
      pw,
      reins_pw,
      ssic_pw,
      pfw,
      reins_pfw,
      ssic_pfw,
      net_pw,
      reins_net_pw,
      ssic_net_pw,
      pc,
      reins_pc,
      ssic_pc,
      pfc,
      reins_pfc,
      ssic_pfc,
      net_pc,
      reins_net_pc,
      ssic_net_pc,
    };
  }

  private calculateCommissionsAndLosses(
    ex: StateExhibit,
    premiums: ReturnType<CashSettlementService['calculatePremiums']>,
    rates: ReturnType<CashSettlementService['resolveRates']>,
  ) {
    const { net_pc, reins_net_pc, ssic_net_pc, pfc, reins_pfc, ssic_pfc } = premiums;
    const { commRate } = rates;

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
    const reins_lp = lp * rates.qShare;
    const ssic_lp = lp * rates.ssicShare;

    // Less: Unearned Loss Adjustment Expense
    const ulae_paid = 0;
    const reins_ulae_paid = 0;
    const ssic_ulae_paid = 0;

    // Less: Defense and Cost Containment (ALAE)
    const laep = getCurVal(ex.laep);
    const reins_laep = laep * rates.qShare;
    const ssic_laep = laep * rates.ssicShare;

    // Less: Adjusting & Other Expenses Paid
    const ae_paid = getCurVal(ex.ae_paid);
    const reins_ae_paid = ae_paid * rates.qShare;
    const ssic_ae_paid = ae_paid * rates.ssicShare;

    // Total Losses Paid
    const total_losses_paid = lp + laep + ae_paid;
    const reins_total_losses_paid = reins_lp + reins_laep + reins_ae_paid;
    const ssic_total_losses_paid = ssic_lp + ssic_laep + ssic_ae_paid;

    // Subtotal Due
    const subtotal_due = net_pc - total_comm_due - total_losses_paid;
    const reins_subtotal_due = reins_net_pc - reins_total_comm_due - reins_total_losses_paid;
    const ssic_subtotal_due = ssic_net_pc - ssic_total_comm_due - ssic_total_losses_paid;

    return {
      comm_due,
      reins_comm_due,
      ssic_comm_due,
      comm_pf,
      reins_comm_pf,
      ssic_comm_pf,
      total_comm_due,
      reins_total_comm_due,
      ssic_total_comm_due,
      loss_funding,
      reins_loss_funding,
      ssic_loss_funding,
      lp,
      reins_lp,
      ssic_lp,
      ulae_paid,
      reins_ulae_paid,
      ssic_ulae_paid,
      laep,
      reins_laep,
      ssic_laep,
      ae_paid,
      reins_ae_paid,
      ssic_ae_paid,
      total_losses_paid,
      reins_total_losses_paid,
      ssic_total_losses_paid,
      subtotal_due,
      reins_subtotal_due,
      ssic_subtotal_due,
    };
  }

  private calculateFeesAndBalances(
    workbook: Workbook,
    premiums: ReturnType<CashSettlementService['calculatePremiums']>,
    lossesAndComm: ReturnType<CashSettlementService['calculateCommissionsAndLosses']>,
    rates: ReturnType<CashSettlementService['resolveRates']>,
  ) {
    const { pw, net_pw, net_pc } = premiums;
    const { reins_subtotal_due } = lossesAndComm;
    const { cfRate, bbRate, xolRate, lrCapRate } = rates;

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
    const reins_total_balance_due =
      reins_subtotal_due + reins_bb_due + reins_xol_due + reins_lr_cap_due;

    // Total Balance Due SSIC
    const ssic_total_balance_due = total_taxes_fees_ssic;

    // Beginning Balance & Amounts Paid
    const begBal = Number(workbook.cashSettlement?.begBal || 0);
    const amtPaid = Number(workbook.cashSettlement?.amtPaid || 0);
    const ending_bal_ssic = ssic_total_balance_due + begBal - amtPaid;

    return {
      ceding_fee_ssic,
      reins_bb_due,
      ssic_bb_due,
      reins_xol_due,
      ssic_xol_due,
      reins_lr_cap_due,
      ssic_lr_cap_due,
      total_taxes_fees_ssic,
      reins_total_balance_due,
      ssic_total_balance_due,
      begBal,
      amtPaid,
      ending_bal_ssic,
    };
  }

  private calculateReserves(ex: StateExhibit, qShare: number, ssicShare: number) {
    const uep = getEndVal(ex.uep);
    const reins_uep = uep * qShare;
    const ssic_uep = uep * ssicShare;

    const loss_reserves = getEndVal(ex.loss_reserves) || getEndVal(ex.lu);
    const reins_loss_reserves = loss_reserves * qShare;
    const ssic_loss_reserves = loss_reserves * ssicShare;

    const lae_reserves =
      (getEndVal(ex.lae_reserves_dcc) || getEndVal(ex.laeu)) +
      (getEndVal(ex.lae_reserves_aoe) || getEndVal(ex.aeu));
    const reins_lae_reserves = lae_reserves * qShare;
    const ssic_lae_reserves = lae_reserves * ssicShare;

    const ulae_reserves = getEndVal(ex.ulae_ibnr);
    const reins_ulae_reserves = ulae_reserves * qShare;
    const ssic_ulae_reserves = ulae_reserves * ssicShare;

    return {
      uep,
      reins_uep,
      ssic_uep,
      loss_reserves,
      reins_loss_reserves,
      ssic_loss_reserves,
      lae_reserves,
      reins_lae_reserves,
      ssic_lae_reserves,
      ulae_reserves,
      reins_ulae_reserves,
      ssic_ulae_reserves,
    };
  }

  private buildRows(
    premiums: ReturnType<CashSettlementService['calculatePremiums']>,
    lossesAndComm: ReturnType<CashSettlementService['calculateCommissionsAndLosses']>,
    feesAndBalances: ReturnType<CashSettlementService['calculateFeesAndBalances']>,
    reserves: ReturnType<CashSettlementService['calculateReserves']>,
  ) {
    const {
      pw,
      reins_pw,
      ssic_pw,
      pfw,
      reins_pfw,
      ssic_pfw,
      net_pw,
      reins_net_pw,
      ssic_net_pw,
      pc,
      reins_pc,
      ssic_pc,
      pfc,
      reins_pfc,
      ssic_pfc,
      net_pc,
      reins_net_pc,
      ssic_net_pc,
    } = premiums;
    const {
      comm_due,
      reins_comm_due,
      ssic_comm_due,
      total_comm_due,
      reins_total_comm_due,
      ssic_total_comm_due,
      lp,
      reins_lp,
      ssic_lp,
      laep,
      reins_laep,
      ssic_laep,
      ae_paid,
      reins_ae_paid,
      ssic_ae_paid,
      total_losses_paid,
      reins_total_losses_paid,
      ssic_total_losses_paid,
      subtotal_due,
      reins_subtotal_due,
      ssic_subtotal_due,
    } = lossesAndComm;
    const {
      ceding_fee_ssic,
      reins_bb_due,
      ssic_bb_due,
      reins_xol_due,
      ssic_xol_due,
      reins_lr_cap_due,
      ssic_lr_cap_due,
      total_taxes_fees_ssic,
      reins_total_balance_due,
      ssic_total_balance_due,
      begBal,
      amtPaid,
      ending_bal_ssic,
    } = feesAndBalances;
    const {
      uep,
      reins_uep,
      ssic_uep,
      loss_reserves,
      reins_loss_reserves,
      ssic_loss_reserves,
      lae_reserves,
      reins_lae_reserves,
      ssic_lae_reserves,
      ulae_reserves,
      reins_ulae_reserves,
      ssic_ulae_reserves,
    } = reserves;

    return [
      {
        id: 1,
        label: '1. QUOTA SHARE PREMIUMS WRITTEN',
        total: pw,
        reins: reins_pw,
        ssic: ssic_pw,
      },
      { id: 2, label: '2. POLICY FEES', total: pfw, reins: reins_pfw, ssic: ssic_pfw },
      {
        id: 3,
        label: '3. NET PREMIUMS INCLUDING POLICY FEES',
        total: net_pw,
        reins: reins_net_pw,
        ssic: ssic_net_pw,
        isBold: true,
      },
      { id: 4, label: '4. COLLECTED PREMIUMS', total: pc, reins: reins_pc, ssic: ssic_pc },
      { id: 5, label: '5. POLICY FEES', total: pfc, reins: reins_pfc, ssic: ssic_pfc },
      {
        id: 6,
        label: '6. NET COLLECTED PREMIUMS',
        total: net_pc,
        reins: reins_net_pc,
        ssic: ssic_net_pc,
        isBold: true,
      },
      {
        id: 7,
        label: '7. LESS: COMMISSION DUE',
        total: comm_due,
        reins: reins_comm_due,
        ssic: ssic_comm_due,
      },
      { id: 8, label: 'LESS: POLICY FEES', total: null, reins: null, ssic: null },
      {
        id: 9,
        label: 'TOTAL COMMISSION DUE',
        total: total_comm_due,
        reins: reins_total_comm_due,
        ssic: ssic_total_comm_due,
        isBold: true,
      },
      { id: 10, label: '8. LESS: LOSS FUNDING', total: null, reins: null, ssic: null },
      {
        id: 11,
        label: 'LESS: LOSSES PAID (net of salvage)',
        total: lp,
        reins: reins_lp,
        ssic: ssic_lp,
      },
      {
        id: 12,
        label: 'LESS: UNEARNED LOSS ADJUSTMENT EXPENSE',
        total: null,
        reins: null,
        ssic: null,
      },
      {
        id: 13,
        label: 'LESS: DEFENSE AND COST CONTAINMENT (ALAE)',
        total: laep,
        reins: reins_laep,
        ssic: ssic_laep,
      },
      {
        id: 14,
        label: 'LESS: ADJUSTING & OTHER EXPENSES PAID',
        total: ae_paid,
        reins: reins_ae_paid,
        ssic: ssic_ae_paid,
      },
      {
        id: 15,
        label: 'TOTAL LOSSES PAID',
        total: total_losses_paid,
        reins: reins_total_losses_paid,
        ssic: ssic_total_losses_paid,
        isBold: true,
      },
      {
        id: 16,
        label: 'SUBTOTAL DUE',
        total: subtotal_due,
        reins: reins_subtotal_due,
        ssic: ssic_subtotal_due,
        isBold: true,
        isSubtotal: true,
      },
      {
        id: 17,
        label: '9. ceding fee due',
        total: null,
        reins: null,
        ssic: ceding_fee_ssic,
        ssicColor: 'green',
      },
      {
        id: 18,
        label: '10. BOARDS & BUREAUS DUE',
        total: null,
        reins: reins_bb_due,
        ssic: ssic_bb_due,
        reinsColor: 'red',
        ssicColor: 'green',
      },
      {
        id: 19,
        label: 'XOL FEES DUE',
        total: null,
        reins: reins_xol_due,
        ssic: ssic_xol_due,
        reinsColor: 'red',
        ssicColor: 'green',
      },
      {
        id: 20,
        label: 'LR Cap',
        total: null,
        reins: reins_lr_cap_due,
        ssic: ssic_lr_cap_due,
        ssicColor: 'green',
      },
      {
        id: 21,
        label: 'TOTAL TAXES & FEES DUE',
        total: null,
        reins: null,
        ssic: total_taxes_fees_ssic,
        isBold: true,
        ssicColor: 'green',
        ssicUnderline: true,
      },
      {
        id: 22,
        label: 'TOTAL BALANCE DUE REINSURERS',
        total: null,
        reins: reins_total_balance_due,
        ssic: null,
        isBold: true,
        reinsColor: 'purple',
      },
      {
        id: 23,
        label: 'TOTAL BALANCE DUE SSIC',
        total: null,
        reins: null,
        ssic: ssic_total_balance_due,
        isBold: true,
        ssicColor: 'green',
      },
      {
        id: 24,
        label: 'Beginning Balance Due TO/(FROM) SSIC',
        total: null,
        reins: null,
        ssic: begBal,
        isInput: 'beg_bal',
      },
      {
        id: 25,
        label: 'Less: Amounts Paid TO/(FROM) SSIC',
        total: null,
        reins: null,
        ssic: amtPaid,
        isInput: 'amt_paid',
      },
      {
        id: 26,
        label: 'Ending Balance Due TO/(FROM) SSIC',
        total: null,
        reins: null,
        ssic: ending_bal_ssic,
        isBold: true,
        ssicColor: 'green',
        ssicUnderline: true,
      },
      {
        id: 27,
        label: 'UNEARNED PREMIUM',
        total: uep,
        reins: reins_uep,
        ssic: ssic_uep,
        isBold: true,
      },
      {
        id: 28,
        label: 'OUTSTANDING LOSS RESERVES',
        total: loss_reserves,
        reins: reins_loss_reserves,
        ssic: ssic_loss_reserves,
        isBold: true,
      },
      {
        id: 29,
        label: 'OUTSTANDING LAE RESERVES',
        total: lae_reserves,
        reins: reins_lae_reserves,
        ssic: ssic_lae_reserves,
        isBold: true,
      },
      {
        id: 30,
        label: 'OUTSTANDING ULAE RESERVES',
        total: ulae_reserves,
        reins: reins_ulae_reserves,
        ssic: ssic_ulae_reserves,
        isBold: true,
      },
    ];
  }
}
