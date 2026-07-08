import { Injectable, NotFoundException } from '@nestjs/common';
import { Workbook } from '../entities/workbook.entity';
import { StateExhibit } from '../entities/state-exhibit.entity';
import { CashSettlement } from '../entities/cash-settlement.entity';
import { UpdateExhibitDto } from '../dto/update-exhibit.dto';
import { UpdateRatesDto } from '../dto/update-rates.dto';
import { UpdateCashSettlementDto } from '../dto/update-cash-settlement.dto';
import { WorkbookUpdatesDao } from './dao/workbook-updates.dao';
import { WorkbooksService } from '../workbooks/workbooks.service';
import { FutReservesService } from '../fut-reserves/fut-reserves.service';
import { FutParserService } from '../fut-parser/fut-parser.service';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';

interface UpdateMappingsDto {
  mga?: string;
  lob?: string;
  lineDescSuffix?: string;
  comp?: string;
  cc?: string;
  ext?: string;
  sub?: string;
}

/** Simple field-level update operations on a workbook and its state exhibits (mappings, exhibit values, ceding rates, cash settlement), including TOTAL-row proportional distribution. */
@Injectable()
export class WorkbookUpdatesService {
  constructor(
    private readonly dao: WorkbookUpdatesDao,
    private readonly workbooksService: WorkbooksService,
    private readonly futReservesService: FutReservesService,
    private readonly futParserService: FutParserService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async updateMappings(workbookId: number, dto: UpdateMappingsDto): Promise<Workbook> {
    const workbook = await this.workbooksService.findOne(workbookId);
    if (dto.mga !== undefined) workbook.mga = dto.mga;
    if (dto.lob !== undefined) workbook.lob = dto.lob;
    if (dto.lineDescSuffix !== undefined) workbook.lineDescSuffix = dto.lineDescSuffix;
    if (dto.comp !== undefined) workbook.comp = dto.comp;
    if (dto.cc !== undefined) workbook.cc = dto.cc;
    if (dto.ext !== undefined) workbook.ext = dto.ext;
    if (dto.sub !== undefined) workbook.sub = dto.sub;
    return this.dao.saveWorkbook(workbook);
  }

  async updateExhibit(
    workbookId: number,
    stateCode: string,
    dto: UpdateExhibitDto,
  ): Promise<StateExhibit> {
    const workbook = await this.workbooksService.findOne(workbookId);
    const exhibit = workbook.stateExhibits.find(e => e.stateCode === stateCode);
    if (!exhibit) {
      throw new NotFoundException(`State exhibit ${stateCode} not found in workbook ${workbookId}`);
    }

    if (stateCode === 'TOTAL') {
      type ExhibitArrayField = keyof UpdateExhibitDto & keyof StateExhibit;
      const fields = Object.keys(dto) as ExhibitArrayField[];
      const nonTotalExhibits = workbook.stateExhibits.filter(e => e.stateCode !== 'TOTAL');

      fields.forEach(field => {
        const totalValues = dto[field];
        if (totalValues !== undefined) {
          for (let c = 0; c < 3; c++) {
            const colTotal = Number(totalValues[c] ?? 0);

            const weights = nonTotalExhibits.map(ex => {
              const existingVal = Number(ex[field]?.[c] ?? 0);
              if (Math.abs(existingVal) > 0.001) {
                return { ex, val: existingVal, isField: true };
              }
              const pwVal = Number(ex.pw?.[c] || 0);
              if (Math.abs(pwVal) > 0.001) {
                return { ex, val: pwVal, isField: false };
              }
              const pw1Val = Number(ex.pw?.[1] || 0);
              if (Math.abs(pw1Val) > 0.001) {
                return { ex, val: pw1Val, isField: false };
              }
              return { ex, val: 1, isField: false };
            });

            let activeWeights = weights;
            const hasFieldWeights = weights.some(w => w.isField);
            if (hasFieldWeights) {
              activeWeights = weights.map(w => (w.isField ? w : { ...w, val: 0 }));
            }

            const sumWeights = activeWeights.reduce((s, w) => s + Math.abs(w.val), 0);

            let distributedSum = 0;
            const stateValues = activeWeights.map(w => {
              let val = 0;
              if (sumWeights > 0.001) {
                val = (colTotal * Math.abs(w.val)) / sumWeights;
              } else {
                val = colTotal / nonTotalExhibits.length;
              }
              const roundedVal = Math.round(val * 100) / 100;
              distributedSum += roundedVal;
              return roundedVal;
            });

            const diff = colTotal - distributedSum;
            if (Math.abs(diff) > 0.001) {
              let maxIdx = 0;
              let maxVal = -1;
              activeWeights.forEach((w, idx) => {
                if (Math.abs(w.val) > maxVal) {
                  maxVal = Math.abs(w.val);
                  maxIdx = idx;
                }
              });
              stateValues[maxIdx] = Number((stateValues[maxIdx] + diff).toFixed(2));
            }

            nonTotalExhibits.forEach((ex, idx) => {
              if (!ex[field]) {
                ex[field] = [0, 0, 0];
              }
              ex[field][c] = stateValues[idx];
            });
          }
        }
      });

      if (nonTotalExhibits.length > 0) {
        await this.dao.saveExhibits(nonTotalExhibits);
      }
    }

    (Object.keys(dto) as (keyof UpdateExhibitDto)[]).forEach(key => {
      const value = dto[key];
      if (value !== undefined) {
        exhibit[key] = value;
      }
    });

    const savedExhibit = await this.dao.saveExhibit(exhibit);
    if (workbook.source === 'FUT') {
      await this.futReservesService.recalculateFUTReserves(workbookId);
    } else {
      await this.futParserService.recalculateTotalExhibit(workbookId);
    }
    const reloadedExhibit = await this.dao.findExhibit(workbookId, stateCode);
    return reloadedExhibit ?? savedExhibit;
  }

  async updateRates(workbookId: number, dto: UpdateRatesDto, userId?: string): Promise<Workbook> {
    const workbook = await this.workbooksService.findOne(workbookId);
    workbook.rates = {
      ...workbook.rates,
      ...dto,
    };
    const savedWorkbook = await this.dao.saveWorkbook(workbook);
    if (savedWorkbook.source === 'FUT') {
      await this.futReservesService.recalculateFUTReserves(workbookId);
    }
    await this.activityLogsService.log({
      userId,
      moduleId: 'reinsurance',
      action: 'edit',
      description: `Updated ceding rates for workbook ${workbook.program} (${workbook.monthLabel})`,
    });
    return this.workbooksService.findOne(workbookId);
  }

  async updateCashSettlement(
    workbookId: number,
    dto: UpdateCashSettlementDto,
    userId?: string,
  ): Promise<CashSettlement> {
    const workbook = await this.workbooksService.findOne(workbookId);
    if (!workbook.cashSettlement) {
      workbook.cashSettlement = this.dao.createCashSettlement({
        workbookId,
        begBal: dto.begBal ?? 0,
        amtPaid: dto.amtPaid ?? 0,
      });
    } else {
      if (dto.begBal !== undefined) workbook.cashSettlement.begBal = dto.begBal;
      if (dto.amtPaid !== undefined) workbook.cashSettlement.amtPaid = dto.amtPaid;
    }
    const saved = await this.dao.saveCashSettlement(workbook.cashSettlement);
    await this.activityLogsService.log({
      userId,
      moduleId: 'reinsurance',
      action: 'edit',
      description: `Updated cash settlement balances for workbook ${workbook.program} (${workbook.monthLabel})`,
    });
    return saved;
  }
}
