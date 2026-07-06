import { Injectable, NotFoundException } from '@nestjs/common';
import { Workbook } from '../../workbook/entities/workbook.entity';
import { StateExhibit } from '../../workbook/entities/state-exhibit.entity';
import { Treaty } from '../../masters/entities/treaty.entity';
import { WorkbooksService } from '../../workbook/workbooks/workbooks.service';
import { WorkbookLookupsService } from '../../workbook/workbook-lookups/workbook-lookups.service';
import { LossIbnrService } from '../../reserves/services/loss-ibnr.service';
import { LaeIbnrService } from '../../reserves/services/lae-ibnr.service';
import { UlaeIbnrService } from '../../reserves/services/ulae-ibnr.service';
import { ReinsuranceStatementDao } from './dao/reinsurance-statement.dao';

/** Builds the reinsurance statement report and owns the shared ceding-value calculation used by GL journal entries. */
@Injectable()
export class ReinsuranceStatementService {
  constructor(
    private readonly dao: ReinsuranceStatementDao,
    private readonly workbooksService: WorkbooksService,
    private readonly workbookLookupsService: WorkbookLookupsService,
    private readonly lossIbnrService: LossIbnrService,
    private readonly laeIbnrService: LaeIbnrService,
    private readonly ulaeIbnrService: UlaeIbnrService,
  ) {}

  async getReinsuranceStatement(workbookId: number, stateCode: string) {
    const workbook = await this.workbooksService.findOne(workbookId);
    const prevStateEx = await this.getPreviousStateExhibit(workbook, stateCode);
    const treaty = await this.dao.findTreatyByProgram(workbook.program);
    const v = this.calculateCedingValues(workbook, stateCode, prevStateEx, treaty);

    const rateComm = workbook.rates.comm ?? 32.0;
    const rateUlae = workbook.rates.ulae ?? 1.0;
    const rateBoards = workbook.rates.boardsCharge ?? 0.4;
    const rateLossCap = workbook.rates.lossRatioCap ?? 2.0;

    const batchNumber = `RE-${workbook.id}-${stateCode.toUpperCase()}`;
    const batch = await this.dao.findBatchByBatchNumber(batchNumber);
    const isPosted = !!batch;

    return {
      isPosted,
      rows: [
        { label: 'Premiums Written', value: v.premiumWritten, isBold: true },
        { label: 'Change in UEP', value: v.changeUEP, formula: 'Previous UEP - Current UEP' },
        {
          label: 'Premiums Earned',
          value: v.premiumsEarned,
          isBold: true,
          borderClass: 'single-underline',
          formula: 'Premiums Written + Change in UEP',
        },
        { label: 'Less:', isHeader: true },
        {
          label: `Ceding Commissions at ${rateComm}%`,
          value: v.cedingCommission,
          formula: 'Premiums Written * Ceding Commission %',
        },
        {
          label: 'Ceding Commissions on UEP',
          value: v.commissionUEP,
          formula: 'Change in UEP * Ceding Commission %',
        },
        {
          label: 'Ceding Commissions Earned',
          value: v.commissionEarned,
          isBold: true,
          borderClass: 'single-underline',
          formula: 'Ceding Commissions + Ceding Commissions on UEP',
        },
        { label: 'Losses Paid (net of salvage & subro)', value: v.lossesPaid },
        {
          label: 'Change in Loss Reserves',
          value: v.changeLossReserves,
          formula: 'Current Loss Reserves - Previous Loss Reserves',
        },
        {
          label: 'Change in Loss IBNR Reserves',
          value: v.changeLossIBNR,
          formula: 'Ultimate Loss - Losses Paid - Change in Loss Reserves',
        },
        {
          label: 'Losses Incurred',
          value: v.lossesIncurred,
          isBold: true,
          borderClass: 'single-underline',
          formula: 'Losses Paid + Change in Loss Reserves + Change in Loss IBNR',
        },
        { label: 'Defense and Cost Containment Expense Paid (DCC)', value: v.dccPaid },
        {
          label: 'Change in DCC Reserves',
          value: v.changeDCCReserves,
          formula: 'Current DCC Reserves - Previous DCC Reserves',
        },
        {
          label: 'Change in DCC IBNR Reserves',
          value: v.changeDCCIBNR,
          formula: 'Ultimate DCC - DCC Paid - Change in DCC Reserves',
        },
        { label: 'Adjusting & Other Expense Paid (AOE)', value: v.aoePaid },
        {
          label: 'Change in AOE Reserves',
          value: v.changeAOEReserves,
          formula: 'Current AOE Reserves - Previous AOE Reserves',
        },
        {
          label: 'Change in AOE IBNR Reserves',
          value: v.changeAOEIBNR,
          formula: 'Ultimate AOE - AOE Paid - Change in AOE Reserves',
        },
        {
          label: `Unallocated Loss Adjustment Expense at ${rateUlae}%`,
          value: v.ulaePaid,
          isBold: true,
          formula: 'Premiums Written * ULAE Ceding %',
        },
        {
          label: 'Change in ULAE IBNR Reserves',
          value: v.changeULAEIBNR,
          formula: '(0.5 * Change in Loss Reserves + Change in Loss IBNR) * 0.005',
        },
        {
          label: 'Loss Adjustment Expenses Incurred',
          value: v.laeIncurred,
          isBold: true,
          borderClass: 'single-underline',
          formula: 'DCC Incurred + AOE Incurred + ULAE Incurred',
        },
        {
          label: `Boards & Bureaus / ISO Charge at ${rateBoards}%`,
          value: v.boardsCharge,
          formula: 'Premiums Written * Boards Charge %',
        },
        {
          label: `Boards & Bureaus / ISO Charge at ${rateBoards}% on UEP`,
          value: v.boardsUEP,
          formula: 'Change in UEP * Boards Charge %',
        },
        {
          label: `Loss Ratio Cap Charge at ${rateLossCap}%`,
          value: v.lossRatioCap,
          formula: 'Premiums Written * Loss Ratio Cap %',
        },
        {
          label: 'Loss Ratio Cap on UEP',
          value: v.lossRatioCapUEP,
          formula: 'Change in UEP * Loss Ratio Cap %',
        },
        {
          label: 'Other Expenses Incurred',
          value: v.otherExpenses,
          isBold: true,
          borderClass: 'single-underline',
          formula: 'Boards Charge + Boards UEP + Loss Ratio Cap + Loss Ratio Cap UEP',
        },
        {
          label: 'Total Profit (Loss)',
          value: v.totalProfit,
          isBold: true,
          borderClass: 'double-underline',
          formula:
            'Premiums Earned - Commission Earned - Losses Incurred - LAE Incurred - Other Expenses Incurred',
        },
        { label: 'Reinsurance Brokerage Fee', value: 0 },
        {
          label: 'Net Settlement due to/(from) Reinsurer',
          value: v.netSettlement,
          isBold: true,
          borderClass: 'double-underline',
          formula:
            'PW - Ceding Commissions - Losses Paid - DCC Paid - AOE Paid - ULAE Paid - Boards Charge - Loss Ratio Cap',
        },
        { label: 'Loss Funding', value: 0 },
        {
          label: 'Net Settlement due from NTA',
          value: v.netSettlementFuturistic,
          isBold: true,
          borderClass: 'double-underline',
          formula: 'PW - Ceding Commissions - Losses Paid - DCC Paid - AOE Paid - ULAE Paid',
        },
        {
          label: 'Fronting Fee @ 5% (paid by separate wire from NTA)',
          value: v.frontingFee,
          formula: 'Premiums Written * 5%',
        },
        { label: 'Fronting Fee on UEP', value: v.frontingFeeUEP, formula: 'Change in UEP * 5%' },
        {
          label: 'Total Fees Earned - SSIC',
          value: v.totalFeesEarned,
          isBold: true,
          borderClass: 'double-underline',
          formula:
            'Boards Charge + Boards UEP + Loss Ratio Cap + Loss Ratio Cap UEP + Fronting Fee + Fronting Fee UEP',
        },
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
        {
          label: 'Total Loss Pick',
          value: v.totalLossPick,
          isRatio: true,
          isBold: true,
          borderClass: 'single-underline',
          formula: 'Loss Pick % + LAE DCC % + LAE AOE %',
        },
        { label: 'Ultimate Loss', value: v.ultimateLoss, formula: 'Premiums Earned * Loss Pick %' },
        {
          label: 'Ultimate LAE - DCC',
          value: v.ultimateLAEDcc,
          formula: 'Premiums Earned * LAE DCC %',
        },
        {
          label: 'Ultimate LAE - AOE',
          value: v.ultimateLAEAoe,
          formula: 'Premiums Earned * LAE AOE %',
        },
        {
          label: 'Ultimate ULAE',
          value: v.ultimateULAE,
          formula: 'ULAE Paid + Change in ULAE IBNR',
        },
        {
          label: '',
          value: v.totalUltimateLossLAE,
          borderClass: 'single-underline',
          formula: 'Ultimate Loss + Ultimate DCC + Ultimate AOE + Ultimate ULAE',
        },
        {
          label: 'Loss & LAE Reserves (including IBNR)',
          value: v.lossLAEReserves,
          isBold: true,
          borderClass: 'single-underline',
          formula:
            'Loss Reserves + Loss IBNR + DCC Reserves + DCC IBNR + AOE Reserves + AOE IBNR + ULAE IBNR',
        },
        {
          label: 'Required Collateral at 115%',
          value: v.requiredCollateral,
          isBold: true,
          borderClass: 'double-underline',
          formula: 'Loss & LAE Reserves * 1.15',
        },
      ],
    };
  }

  calculateCedingValues(
    workbook: Workbook,
    stateCode: string,
    prevStateEx: StateExhibit | null,
    treaty?: Treaty | null,
  ) {
    const activeStateEx = workbook.stateExhibits.find(e => e.stateCode === stateCode);
    if (!activeStateEx) {
      throw new NotFoundException(
        `State exhibit for ${stateCode} not found in workbook ${workbook.id}`,
      );
    }

    type NumericArrayField =
      | 'pw'
      | 'pfw'
      | 'pc'
      | 'pfc'
      | 'tax'
      | 'lp'
      | 'laep'
      | 'ae_paid'
      | 'pe'
      | 'pfe'
      | 'uep'
      | 'lu'
      | 'laeu'
      | 'aeu'
      | 'loss_reserves'
      | 'lae_reserves_dcc'
      | 'lae_reserves_aoe'
      | 'loss_ibnr'
      | 'lae_ibnr_dcc'
      | 'lae_ibnr_aoe'
      | 'ulae_ibnr';

    const getVal = (ex: StateExhibit, field: NumericArrayField, mode: 'current' | 'cumulative') => {
      const arr = ex[field];
      if (!arr) return 0;
      const source = ex.workbook?.source ?? workbook.source;
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

    console.warn(`[ReinsuranceStatementService] calculateCedingValues for ${stateCode}:`);
    console.warn(`  Active exhibit source: ${workbook.source}, has prevStateEx: ${!!prevStateEx}`);
    console.warn(`  Active rates: ${JSON.stringify(workbook.rates)}`);
    console.warn(
      `  Active loss_ibnr: ${JSON.stringify(activeStateEx.loss_ibnr)}, lae_ibnr_dcc: ${JSON.stringify(activeStateEx.lae_ibnr_dcc)}, ulae_ibnr: ${JSON.stringify(activeStateEx.ulae_ibnr)}`,
    );
    if (prevStateEx) {
      console.warn(
        `  Prev loss_ibnr: ${JSON.stringify(prevStateEx.loss_ibnr)}, lae_ibnr_dcc: ${JSON.stringify(prevStateEx.lae_ibnr_dcc)}, ulae_ibnr: ${JSON.stringify(prevStateEx.ulae_ibnr)}`,
      );
    }

    const rateComm = workbook.rates.comm ?? 32.0;
    const rateUlae = workbook.rates.ulae ?? 1.0;
    const lossPick = workbook.rates.lossPick ?? 51.8;
    const laeDcc = workbook.rates.laeDcc ?? 6.2;
    const laeAoe = workbook.rates.laeAoe ?? 0.0;
    const rateBoards = workbook.rates.boardsCharge ?? 0.4;
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
        const hasPrevDetailedReserves =
          prevStateEx &&
          (prevStateEx.loss_ibnr?.some(v => Number(v) !== 0) ||
            prevStateEx.lae_ibnr_dcc?.some(v => Number(v) !== 0) ||
            prevStateEx.lae_ibnr_aoe?.some(v => Number(v) !== 0) ||
            prevStateEx.ulae_ibnr?.some(v => Number(v) !== 0));

        if (hasPrevDetailedReserves) {
          prevLossReserves = prevStateEx.loss_reserves
            ? getVal(prevStateEx, 'loss_reserves', 'cumulative')
            : 0;
          prevLossIBNR = prevStateEx.loss_ibnr ? getVal(prevStateEx, 'loss_ibnr', 'cumulative') : 0;
          prevULAEIBNR = prevStateEx.ulae_ibnr ? getVal(prevStateEx, 'ulae_ibnr', 'cumulative') : 0;

          if (isDccActive) {
            prevDCCReserves =
              (prevStateEx.lae_reserves_dcc
                ? getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative')
                : 0) +
              (prevStateEx.lae_reserves_aoe
                ? getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative')
                : 0);
            prevDCCIBNR =
              (prevStateEx.lae_ibnr_dcc ? getVal(prevStateEx, 'lae_ibnr_dcc', 'cumulative') : 0) +
              (prevStateEx.lae_ibnr_aoe ? getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') : 0);
            prevAOEReserves = 0;
            prevAOEIBNR = 0;
          } else if (isAoeActive) {
            prevAOEReserves =
              (prevStateEx.lae_reserves_aoe
                ? getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative')
                : 0) +
              (prevStateEx.lae_reserves_dcc
                ? getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative')
                : 0);
            prevAOEIBNR =
              (prevStateEx.lae_ibnr_aoe ? getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') : 0) +
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
        prevLossReserves = prevStateEx.loss_reserves
          ? getVal(prevStateEx, 'loss_reserves', 'cumulative')
          : 0;
        prevLossIBNR = prevStateEx.loss_ibnr ? getVal(prevStateEx, 'loss_ibnr', 'cumulative') : 0;
        prevULAEIBNR = prevStateEx.ulae_ibnr ? getVal(prevStateEx, 'ulae_ibnr', 'cumulative') : 0;

        if (isDccActive) {
          prevDCCReserves =
            (prevStateEx.lae_reserves_dcc
              ? getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative')
              : 0) +
            (prevStateEx.lae_reserves_aoe
              ? getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative')
              : 0);
          prevDCCIBNR =
            (prevStateEx.lae_ibnr_dcc ? getVal(prevStateEx, 'lae_ibnr_dcc', 'cumulative') : 0) +
            (prevStateEx.lae_ibnr_aoe ? getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') : 0);
          prevAOEReserves = 0;
          prevAOEIBNR = 0;
        } else if (isAoeActive) {
          prevAOEReserves =
            (prevStateEx.lae_reserves_aoe
              ? getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative')
              : 0) +
            (prevStateEx.lae_reserves_dcc
              ? getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative')
              : 0);
          prevAOEIBNR =
            (prevStateEx.lae_ibnr_aoe ? getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') : 0) +
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
      prevLossReserves = activeStateEx.loss_reserves
        ? getVal(activeStateEx, 'loss_reserves', 'cumulative')
        : 0;
      prevLossIBNR = activeStateEx.loss_ibnr ? getVal(activeStateEx, 'loss_ibnr', 'cumulative') : 0;
      prevULAEIBNR = activeStateEx.ulae_ibnr ? getVal(activeStateEx, 'ulae_ibnr', 'cumulative') : 0;

      if (isDccActive) {
        prevDCCReserves =
          (activeStateEx.lae_reserves_dcc
            ? getVal(activeStateEx, 'lae_reserves_dcc', 'cumulative')
            : 0) +
          (activeStateEx.lae_reserves_aoe
            ? getVal(activeStateEx, 'lae_reserves_aoe', 'cumulative')
            : 0);
        prevDCCIBNR =
          (activeStateEx.lae_ibnr_dcc ? getVal(activeStateEx, 'lae_ibnr_dcc', 'cumulative') : 0) +
          (activeStateEx.lae_ibnr_aoe ? getVal(activeStateEx, 'lae_ibnr_aoe', 'cumulative') : 0);
        prevAOEReserves = 0;
        prevAOEIBNR = 0;
      } else if (isAoeActive) {
        prevAOEReserves =
          (activeStateEx.lae_reserves_aoe
            ? getVal(activeStateEx, 'lae_reserves_aoe', 'cumulative')
            : 0) +
          (activeStateEx.lae_reserves_dcc
            ? getVal(activeStateEx, 'lae_reserves_dcc', 'cumulative')
            : 0);
        prevAOEIBNR =
          (activeStateEx.lae_ibnr_aoe ? getVal(activeStateEx, 'lae_ibnr_aoe', 'cumulative') : 0) +
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
      prevLossReserves = activeStateEx.loss_reserves
        ? getVal(activeStateEx, 'loss_reserves', 'cumulative')
        : 0;
      prevLossIBNR = activeStateEx.loss_ibnr ? getVal(activeStateEx, 'loss_ibnr', 'cumulative') : 0;
      prevULAEIBNR = activeStateEx.ulae_ibnr ? getVal(activeStateEx, 'ulae_ibnr', 'cumulative') : 0;

      if (isDccActive) {
        prevDCCReserves =
          (activeStateEx.lae_reserves_dcc
            ? getVal(activeStateEx, 'lae_reserves_dcc', 'cumulative')
            : 0) +
          (activeStateEx.lae_reserves_aoe
            ? getVal(activeStateEx, 'lae_reserves_aoe', 'cumulative')
            : 0);
        prevDCCIBNR =
          (activeStateEx.lae_ibnr_dcc ? getVal(activeStateEx, 'lae_ibnr_dcc', 'cumulative') : 0) +
          (activeStateEx.lae_ibnr_aoe ? getVal(activeStateEx, 'lae_ibnr_aoe', 'cumulative') : 0);
        prevAOEReserves = 0;
        prevAOEIBNR = 0;
      } else if (isAoeActive) {
        prevAOEReserves =
          (activeStateEx.lae_reserves_aoe
            ? getVal(activeStateEx, 'lae_reserves_aoe', 'cumulative')
            : 0) +
          (activeStateEx.lae_reserves_dcc
            ? getVal(activeStateEx, 'lae_reserves_dcc', 'cumulative')
            : 0);
        prevAOEIBNR =
          (activeStateEx.lae_ibnr_aoe ? getVal(activeStateEx, 'lae_ibnr_aoe', 'cumulative') : 0) +
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

    console.warn(
      `  Computed prev values: lossReserves=${prevLossReserves}, lossIBNR=${prevLossIBNR}, dccReserves=${prevDCCReserves}, dccIBNR=${prevDCCIBNR}, aoeReserves=${prevAOEReserves}, aoeIBNR=${prevAOEIBNR}, ulaeIBNR=${prevULAEIBNR}`,
    );

    const changeUEP = prevUEP - currUEP;
    const premiumsEarned = pw + changeUEP;

    const cedingCommission = pw * (rateComm / 100);
    const commissionUEP = 0.0;
    const commissionEarned = cedingCommission + commissionUEP;

    // Determine if we have direct reserve entries in the current active exhibit
    const hasReserves =
      getVal(activeStateEx, 'loss_reserves', 'current') !== 0 ||
      getVal(activeStateEx, 'loss_ibnr', 'current') !== 0 ||
      getVal(activeStateEx, 'lae_reserves_dcc', 'current') !== 0 ||
      getVal(activeStateEx, 'lae_ibnr_dcc', 'current') !== 0 ||
      getVal(activeStateEx, 'lae_reserves_aoe', 'current') !== 0 ||
      getVal(activeStateEx, 'lae_ibnr_aoe', 'current') !== 0 ||
      getVal(activeStateEx, 'ulae_ibnr', 'current') !== 0;

    // Also consider reserves present if we have a valid previous workbook with reserve data
    const hasPrevReserves =
      prevStateEx !== null &&
      (getVal(prevStateEx, 'loss_ibnr', 'cumulative') !== 0 ||
        getVal(prevStateEx, 'loss_reserves', 'cumulative') !== 0 ||
        getVal(prevStateEx, 'lae_ibnr_dcc', 'cumulative') !== 0 ||
        getVal(prevStateEx, 'lae_reserves_dcc', 'cumulative') !== 0 ||
        getVal(prevStateEx, 'lae_ibnr_aoe', 'cumulative') !== 0 ||
        getVal(prevStateEx, 'lae_reserves_aoe', 'cumulative') !== 0 ||
        getVal(prevStateEx, 'ulae_ibnr', 'cumulative') !== 0);

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
    if (treaty?.ulaeType === 'flat_rate') {
      if (treaty.ulaeFlatAmount !== null && Number(treaty.ulaeFlatAmount) > 0) {
        ulaePaid = Number(treaty.ulaeFlatAmount);
      } else {
        const basis = treaty.ulaeBasis ?? 'earned_premium';
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
        currDCCReserves =
          getVal(activeStateEx, 'laeu', 'current') + getVal(activeStateEx, 'aeu', 'current');
        currAOEReserves = 0;
      } else if (isAoeActive) {
        currAOEReserves =
          getVal(activeStateEx, 'laeu', 'current') + getVal(activeStateEx, 'aeu', 'current');
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
        currDCCReserves =
          getVal(activeStateEx, 'lae_reserves_dcc', 'current') +
          getVal(activeStateEx, 'lae_reserves_aoe', 'current');
        currDCCIBNR =
          getVal(activeStateEx, 'lae_ibnr_dcc', 'current') +
          getVal(activeStateEx, 'lae_ibnr_aoe', 'current');
        currAOEReserves = 0;
        currAOEIBNR_val = 0;
      } else if (isAoeActive) {
        currAOEReserves =
          getVal(activeStateEx, 'lae_reserves_aoe', 'current') +
          getVal(activeStateEx, 'lae_reserves_dcc', 'current');
        currAOEIBNR_val =
          getVal(activeStateEx, 'lae_ibnr_aoe', 'current') +
          getVal(activeStateEx, 'lae_ibnr_dcc', 'current');
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
      const lossRes = this.lossIbnrService.calculateLossReserves(
        premiumsEarned,
        prevLossIBNR,
        lossPick,
      );
      const laeRes = this.laeIbnrService.calculateLAEReserves(
        premiumsEarned,
        prevDCCIBNR,
        prevAOEIBNR,
        laeDcc,
        laeAoe,
      );
      const ulaeRes = this.ulaeIbnrService.calculateULAEReserves(
        pw,
        rateUlae,
        lossRes.changeLossReserves,
        lossRes.changeLossIBNR,
        prevULAEIBNR,
      );

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

    const totalProfit =
      premiumsEarned - commissionEarned - lossesIncurred - laeIncurred - otherExpenses;

    const netSettlement =
      pw -
      cedingCommission -
      lossesPaid -
      dccPaid -
      aoePaid -
      ulaePaid -
      boardsCharge -
      lossRatioCap;
    const netSettlementFuturistic =
      pw - cedingCommission - lossesPaid - dccPaid - aoePaid - ulaePaid;

    const frontingFee = pw * 0.05;
    const frontingFeeUEP = changeUEP * 0.05;
    const totalFeesEarned =
      boardsCharge + boardsUEP + lossRatioCap + lossRatioCapUEP + frontingFee + frontingFeeUEP;

    const totalLossPick = lossPick + laeDcc + laeAoe;
    const ultimateLoss = lossesIncurred;
    const ultimateLAEDcc = dccIncurred;
    const ultimateLAEAoe = aoeIncurred;
    const ultimateULAE = ulaeIncurred;
    const totalUltimateLossLAE = ultimateLoss + ultimateLAEDcc + ultimateLAEAoe + ultimateULAE;

    const lossLAEReserves =
      currLossReserves +
      currLossIBNR +
      currDCCReserves +
      currDCCIBNR +
      currAOEReserves +
      currAOEIBNR_val +
      currULAEIBNR;
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

  async getPreviousStateExhibit(
    workbook: Workbook,
    stateCode: string,
  ): Promise<StateExhibit | null> {
    const prevWb = await this.workbookLookupsService.findPreviousWorkbookFor(workbook);
    if (!prevWb?.stateExhibits) return null;

    let ex = prevWb.stateExhibits.find(e => e.stateCode === stateCode) ?? null;
    if (ex) {
      ex.workbook = prevWb;
      return ex;
    }

    try {
      const stateRes = await this.dao.queryStateMasterByCode(stateCode);
      if (stateRes.length > 0) {
        const stateObj = stateRes[0];
        const altCode =
          stateCode === stateObj.state_abbr ? String(stateObj.state_code) : stateObj.state_abbr;
        ex = prevWb.stateExhibits.find(e => String(e.stateCode) === altCode) ?? null;
      }
    } catch (err) {
      console.error('Error matching state code in getPreviousStateExhibit:', err);
    }

    if (ex) {
      ex.workbook = prevWb;
    }
    return ex;
  }
}
