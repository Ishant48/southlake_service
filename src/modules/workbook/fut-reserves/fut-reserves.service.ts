import { Injectable } from '@nestjs/common';
import { Workbook } from '../entities/workbook.entity';
import { StateExhibit } from '../entities/state-exhibit.entity';
import { FutReservesDao, StateMasterRow } from './dao/fut-reserves.dao';
import { WorkbookLookupsService } from '../workbook-lookups/workbook-lookups.service';
import { FutParserService } from '../fut-parser/fut-parser.service';

/**
 * Recalculates FUT reserve roll-forward (loss/LAE/ULAE reserves and IBNR) for every non-TOTAL state
 * exhibit of a FUT workbook, seeded from the program's previous-month (or ITD baseline) workbook,
 * then recomputes the aggregate TOTAL exhibit. This is actuarial roll-forward math — do not alter
 * the formulas without sign-off from the originating spreadsheet owner.
 */
@Injectable()
export class FutReservesService {
  constructor(
    private readonly dao: FutReservesDao,
    private readonly workbookLookupsService: WorkbookLookupsService,
    private readonly futParserService: FutParserService,
  ) {}

  private async populateWorkbookRates(workbook: Workbook): Promise<void> {
    if (!workbook) return;
    const treaty = await this.dao.findTreatyByName(workbook.program);
    if (treaty) {
      workbook.rates = {
        ...workbook.rates,
        qs: workbook.rates?.qs ?? (treaty.qsPct !== null ? Number(treaty.qsPct) : 100),
        cf: workbook.rates?.cf ?? (treaty.cfPct !== null ? Number(treaty.cfPct) : 5),
        comm: workbook.rates?.comm ?? (treaty.commPct !== null ? Number(treaty.commPct) : 29),
        bb: workbook.rates?.bb ?? (treaty.bbPct !== null ? Number(treaty.bbPct) : 0.4),
        ulae: workbook.rates?.ulae ?? (treaty.ulaePct !== null ? Number(treaty.ulaePct) : 7),
        xol: workbook.rates?.xol ?? (treaty.xolPct !== null ? Number(treaty.xolPct) : 0),
        lr: workbook.rates?.lr ?? (treaty.lrCapPct !== null ? Number(treaty.lrCapPct) : 2.0),

        lossPick:
          workbook.rates?.lossPick ?? (treaty.ibnrPct !== null ? Number(treaty.ibnrPct) : 5.0),
        boardsCharge:
          workbook.rates?.boardsCharge ?? (treaty.bbPct !== null ? Number(treaty.bbPct) : 0.4),
        lossRatioCap:
          workbook.rates?.lossRatioCap ??
          (treaty.lrCapPct !== null ? Number(treaty.lrCapPct) : 2.0),
        laeDcc:
          treaty.laeDccPct !== null ? Number(treaty.laeDccPct) : (workbook.rates?.laeDcc ?? 6.2),
        laeAoe:
          treaty.laeAoePct !== null ? Number(treaty.laeAoePct) : (workbook.rates?.laeAoe ?? 0.0),
      };
    }
  }

  private buildStateMap(stateMaster: StateMasterRow[]): Map<string, string> {
    const stateMap = new Map<string, string>();
    for (const row of stateMaster) {
      stateMap.set(String(row.state_code), String(row.state_abbr));
      stateMap.set(String(row.state_abbr), String(row.state_code));
    }
    return stateMap;
  }

  private findMatchingPrevExhibit(
    ex: StateExhibit,
    prevStateExhibits: StateExhibit[],
    stateMap: Map<string, string>,
  ): StateExhibit | undefined {
    return prevStateExhibits.find(pe => {
      if (pe.stateCode === ex.stateCode) return true;
      const mapped = stateMap.get(pe.stateCode);
      return mapped && mapped === ex.stateCode;
    });
  }

  private recalculateExhibit(
    ex: StateExhibit,
    prevEx: StateExhibit | undefined,
    prevSource: string | undefined,
    lossPick: number,
    laeDcc: number,
    laeAoe: number,
  ): void {
    const isDccActive = laeDcc > 0;
    const isAoeActive = laeAoe > 0;

    const getPrevYTD = (arr: number[] | undefined) => {
      if (!arr) return 0;
      if (prevSource === 'ITD') {
        return Number(arr[1] ?? 0);
      }
      if (arr.length > 2) return Number(arr[2] ?? 0);
      if (arr.length > 1) return Number(arr[1] ?? 0);
      return Number(arr[0] ?? 0);
    };

    const prev_uep_val = getPrevYTD(prevEx?.uep);
    const prev_loss_reserves_val = getPrevYTD(prevEx?.loss_reserves);
    const prev_loss_ibnr_val = getPrevYTD(prevEx?.loss_ibnr) || getPrevYTD(prevEx?.lu);
    const prev_lae_reserves_dcc_val = getPrevYTD(prevEx?.lae_reserves_dcc);
    const prev_lae_ibnr_dcc_val = getPrevYTD(prevEx?.lae_ibnr_dcc) || getPrevYTD(prevEx?.laeu);
    const prev_lae_reserves_aoe_val = getPrevYTD(prevEx?.lae_reserves_aoe);
    const prev_lae_ibnr_aoe_val = getPrevYTD(prevEx?.lae_ibnr_aoe);
    const prev_ulae_ibnr_val = getPrevYTD(prevEx?.ulae_ibnr) || getPrevYTD(prevEx?.aeu);

    const pw = ex.pw || [0, 0, 0];
    const uep = ex.uep || [0, 0, 0];
    const lp = ex.lp || [0, 0, 0];
    const laep = ex.laep || [0, 0, 0];
    const lu = ex.lu || [0, 0, 0];
    const laeu = ex.laeu || [0, 0, 0];
    const aeu = ex.aeu || [0, 0, 0];

    // Prior values (index 0)
    uep[0] = prev_uep_val;

    const loss_reserves = [prev_loss_reserves_val, 0, 0];
    const loss_ibnr = [prev_loss_ibnr_val, 0, 0];
    const lae_reserves_dcc = [prev_lae_reserves_dcc_val, 0, 0];
    const lae_ibnr_dcc = [prev_lae_ibnr_dcc_val, 0, 0];
    const lae_reserves_aoe = [prev_lae_reserves_aoe_val, 0, 0];
    const lae_ibnr_aoe = [prev_lae_ibnr_aoe_val, 0, 0];
    const ulae_ibnr = [prev_ulae_ibnr_val, 0, 0];

    // Current activity (index 1)
    const pwVal = Number(pw[1] || 0);
    const currUEP = Number(uep[1] || 0);
    const lossesPaid = Number(lp[1] || 0);

    let dccPaid = 0;
    let aoePaid = 0;
    const rawLaep = Number(laep[1] || 0);
    if (isDccActive) {
      dccPaid = rawLaep;
      aoePaid = 0;
    } else if (isAoeActive) {
      aoePaid = rawLaep;
      dccPaid = 0;
    }

    const changeUEP = prev_uep_val - currUEP;
    const premiumsEarned = pwVal + changeUEP;

    const currLossReservesVal = Number(lu[1] || 0);
    let currDCCReservesVal = 0;
    let currAOEReservesVal = 0;

    if (isDccActive) {
      currDCCReservesVal = Number(laeu[1] || 0) + Number(aeu[1] || 0);
      currAOEReservesVal = 0;
    } else if (isAoeActive) {
      currAOEReservesVal = Number(laeu[1] || 0) + Number(aeu[1] || 0);
      currDCCReservesVal = 0;
    }

    const ultimateLoss = premiumsEarned * (lossPick / 100);
    const ultimateLAEDcc = premiumsEarned * (laeDcc / 100);
    const ultimateLAEAoe = premiumsEarned * (laeAoe / 100);

    const changeLossReserves = currLossReservesVal - prev_loss_reserves_val;
    const changeLossIBNR = ultimateLoss - lossesPaid - changeLossReserves;
    const currLossIBNRVal = prev_loss_ibnr_val + changeLossIBNR;

    const changeDCCReserves = currDCCReservesVal - prev_lae_reserves_dcc_val;
    const changeDCCIBNR = ultimateLAEDcc - dccPaid - changeDCCReserves;
    const currDCCIBNRVal = prev_lae_ibnr_dcc_val + changeDCCIBNR;

    const changeAOEReserves = currAOEReservesVal - prev_lae_reserves_aoe_val;
    const changeAOEIBNR = ultimateLAEAoe - aoePaid - changeAOEReserves;
    const currAOEIBNRVal = prev_lae_ibnr_aoe_val + changeAOEIBNR;

    const changeULAEIBNR = (0.5 * changeLossReserves + changeLossIBNR) * 0.005;
    const currULAEIBNRVal = prev_ulae_ibnr_val + changeULAEIBNR;

    loss_reserves[1] = Number(currLossReservesVal.toFixed(2));
    loss_ibnr[1] = Number(currLossIBNRVal.toFixed(2));
    lae_reserves_dcc[1] = Number((isDccActive ? currDCCReservesVal : 0).toFixed(2));
    lae_ibnr_dcc[1] = Number((isDccActive ? currDCCIBNRVal : 0).toFixed(2));
    lae_reserves_aoe[1] = Number((isAoeActive ? currAOEReservesVal : 0).toFixed(2));
    lae_ibnr_aoe[1] = Number((isAoeActive ? currAOEIBNRVal : 0).toFixed(2));
    ulae_ibnr[1] = Number(currULAEIBNRVal.toFixed(2));

    // YTD values for reserves (balance sheet items) are simply the end-of-month (current) values
    loss_reserves[2] = loss_reserves[1];
    loss_ibnr[2] = loss_ibnr[1];
    lae_reserves_dcc[2] = lae_reserves_dcc[1];
    lae_ibnr_dcc[2] = lae_ibnr_dcc[1];
    lae_reserves_aoe[2] = lae_reserves_aoe[1];
    lae_ibnr_aoe[2] = lae_ibnr_aoe[1];
    ulae_ibnr[2] = ulae_ibnr[1];

    // UEP YTD value is the end-of-month value
    uep[2] = uep[1];

    ex.pw = pw;
    ex.uep = uep;
    ex.loss_reserves = loss_reserves;
    ex.loss_ibnr = loss_ibnr;
    ex.lae_reserves_dcc = lae_reserves_dcc;
    ex.lae_ibnr_dcc = lae_ibnr_dcc;
    ex.lae_reserves_aoe = lae_reserves_aoe;
    ex.lae_ibnr_aoe = lae_ibnr_aoe;
    ex.ulae_ibnr = ulae_ibnr;
  }

  async recalculateFUTReserves(workbookId: number): Promise<void> {
    const workbook = await this.dao.findWorkbookWithExhibits(workbookId);
    if (workbook?.source !== 'FUT') {
      return;
    }

    await this.populateWorkbookRates(workbook);

    const stateMaster = await this.dao.queryStateMaster();
    const stateMap = this.buildStateMap(stateMaster);

    const prevWb = await this.workbookLookupsService.findPreviousWorkbookFor(workbook);
    const prevSource = prevWb?.source;
    const prevStateExhibits = prevWb?.stateExhibits ?? [];

    const rates = workbook.rates || {};
    const lossPick = rates.lossPick ?? 51.8;
    const laeDcc = rates.laeDcc ?? 6.2;
    const laeAoe = rates.laeAoe ?? 0.0;

    const nonTotalExhibits = workbook.stateExhibits.filter(e => e.stateCode !== 'TOTAL');

    for (const ex of nonTotalExhibits) {
      const prevEx = this.findMatchingPrevExhibit(ex, prevStateExhibits, stateMap);
      this.recalculateExhibit(ex, prevEx, prevSource, lossPick, laeDcc, laeAoe);
      await this.dao.saveExhibit(ex);
    }

    await this.futParserService.recalculateTotalExhibit(workbookId);
  }
}
