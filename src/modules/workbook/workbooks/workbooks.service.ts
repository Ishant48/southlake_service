import { Injectable, NotFoundException } from '@nestjs/common';
import { Workbook } from '../entities/workbook.entity';
import { WorkbooksDao } from './dao/workbooks.dao';
import { FutReservesService } from '../fut-reserves/fut-reserves.service';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { Treaty } from '../../masters/entities/treaty.entity';

export interface ProgramRates {
  comm?: number;
  ulae?: number;
  lossPick?: number;
  laeDcc?: number;
  laeAoe?: number;
  boardsCharge?: number;
  bb?: number;
  lossRatioCap?: number;
  lr?: number;
  qs?: number;
  cf?: number;
  xol?: number;
}

export interface ProgramSummary {
  id: string;
  name: string;
  rates: ProgramRates;
}

/** CRUD for workbooks and program (treaty) rate lookups; populates effective rates and triggers FUT reserve recalculation on read for FUT-sourced workbooks. */
@Injectable()
export class WorkbooksService {
  constructor(
    private readonly dao: WorkbooksDao,
    private readonly futReservesService: FutReservesService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findPrograms(): Promise<ProgramSummary[]> {
    const treaties = await this.dao.findAllTreaties();
    return treaties.map(t => ({
      id: t.id,
      name: t.name,
      rates: {
        comm: t.commPct !== null ? Number(t.commPct) : undefined,
        ulae: t.ulaePct !== null ? Number(t.ulaePct) : undefined,
        lossPick: t.ibnrPct !== null ? Number(t.ibnrPct) : undefined,
        laeDcc: t.laeDccPct !== null ? Number(t.laeDccPct) : undefined,
        laeAoe: t.laeAoePct !== null ? Number(t.laeAoePct) : undefined,
        boardsCharge: t.bbPct !== null ? Number(t.bbPct) : undefined,
        lossRatioCap: t.lrCapPct !== null ? Number(t.lrCapPct) : undefined,
        qs: t.qsPct !== null ? Number(t.qsPct) : undefined,
        cf: t.cfPct !== null ? Number(t.cfPct) : undefined,
        xol: t.xolPct !== null ? Number(t.xolPct) : undefined,
        lr: t.lrCapPct !== null ? Number(t.lrCapPct) : undefined,
      },
    }));
  }

  async createProgram(name: string, rates: ProgramRates): Promise<Treaty> {
    let existing = await this.dao.findTreatyByName(name);
    existing ??= this.dao.createTreaty({
      name,
      treatyCode: name.toUpperCase().replace(/\s+/g, '_'),
    });
    existing.qsPct = rates.qs ?? null;
    existing.cfPct = rates.cf ?? null;
    existing.commPct = rates.comm ?? null;
    existing.bbPct = rates.boardsCharge ?? rates.bb ?? null;
    existing.ulaePct = rates.ulae ?? null;
    existing.xolPct = rates.xol ?? null;
    existing.lrCapPct = rates.lossRatioCap ?? rates.lr ?? null;
    existing.ibnrPct = rates.lossPick ?? null;
    return this.dao.saveTreaty(existing);
  }

  async findAll(): Promise<Workbook[]> {
    return this.dao.findAllWorkbooks();
  }

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

  async findOne(id: number): Promise<Workbook> {
    let workbook = await this.dao.findWorkbookById(id);
    if (!workbook) {
      throw new NotFoundException(`Workbook with ID ${id} not found`);
    }

    await this.populateWorkbookRates(workbook);

    if (workbook.source === 'FUT') {
      await this.futReservesService.recalculateFUTReserves(id);
      const reloaded = await this.dao.findWorkbookById(id);
      if (reloaded) {
        workbook = reloaded;
        await this.populateWorkbookRates(workbook);
      }
    }

    if (workbook.stateExhibits) {
      workbook.stateExhibits.sort((a, b) => {
        if (a.stateCode === 'TOTAL') return -1;
        if (b.stateCode === 'TOTAL') return 1;
        return a.stateCode.localeCompare(b.stateCode);
      });
    }
    return workbook;
  }

  private async deleteAssociatedBatches(workbookId: number): Promise<void> {
    const idStr = String(workbookId);
    await this.dao.query(
      `DELETE FROM journal_entries WHERE batch_id IN (
        SELECT id FROM journal_entry_batches WHERE batch_number LIKE 'RE-' || $1 || '-%'
      )`,
      [idStr],
    );
    await this.dao.query(
      `DELETE FROM journal_entry_batches WHERE batch_number LIKE 'RE-' || $1 || '-%'`,
      [idStr],
    );
  }

  async delete(id: number, userId?: string): Promise<void> {
    const workbook = await this.findOne(id);
    await this.deleteAssociatedBatches(id);
    await this.dao.deleteWorkbook(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'reinsurance',
      action: 'delete',
      description: `Deleted workbook ${workbook.program} (${workbook.monthLabel})`,
    });
  }

  async updateStatus(id: number, status: string, userId?: string): Promise<Workbook> {
    const workbook = await this.findOne(id);
    workbook.status = status;
    const saved = await this.dao.saveWorkbook(workbook);
    await this.populateWorkbookRates(saved);
    await this.activityLogsService.log({
      userId,
      moduleId: 'reinsurance',
      action: status === 'Approved' ? 'approve' : 'edit',
      description: `Workbook status updated to ${status} for ${workbook.program} (${workbook.monthLabel})`,
    });
    return saved;
  }
}
