import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../../entities/workbook.entity';
import { StateExhibit } from '../../../entities/state-exhibit.entity';
import { CashSettlement } from '../../../entities/cash-settlement.entity';
import { Treaty } from '../../../entities/treaty.entity';
import { UpdateExhibitDto } from '../dto/update-exhibit.dto';
import { UpdateRatesDto } from '../dto/update-rates.dto';
import { UpdateCashSettlementDto } from '../dto/update-cash-settlement.dto';
import { ExcelParserService } from './excel-parser.service';
import * as XLSX from 'xlsx';

@Injectable()
export class WorkbookService {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
    @InjectRepository(StateExhibit)
    private readonly stateExhibitRepo: Repository<StateExhibit>,
    @InjectRepository(CashSettlement)
    private readonly cashSettlementRepo: Repository<CashSettlement>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,

    private readonly excelParserService: ExcelParserService,
  ) {}

  async findPrograms(): Promise<any[]> {
    const treaties = await this.treatyRepo.find({ order: { name: 'ASC' } });
    return treaties.map((t) => ({
      id: t.id,
      name: t.name,
      rates: {
        comm: t.commPct !== null ? Number(t.commPct) : undefined,
        ulae: t.ulaePct !== null ? Number(t.ulaePct) : undefined,
        lossPick: t.ibnrPct !== null ? Number(t.ibnrPct) : undefined,
        laeDcc: t.ulaePct !== null ? Number(t.ulaePct) : undefined,
        laeAoe: t.ulaePct !== null ? Number(t.ulaePct) : undefined,
        boardsCharge: t.bbPct !== null ? Number(t.bbPct) : undefined,
        lossRatioCap: t.lrCapPct !== null ? Number(t.lrCapPct) : undefined,
        qs: t.qsPct !== null ? Number(t.qsPct) : undefined,
        cf: t.cfPct !== null ? Number(t.cfPct) : undefined,
        xol: t.xolPct !== null ? Number(t.xolPct) : undefined,
        lr: t.lrCapPct !== null ? Number(t.lrCapPct) : undefined,
      }
    }));
  }

  async createProgram(name: string, rates: any): Promise<any> {
    let existing = await this.treatyRepo.findOne({ where: { name } });
    if (!existing) {
      existing = this.treatyRepo.create({
        name,
        treatyCode: name.toUpperCase().replace(/\s+/g, '_'),
      });
    }
    existing.qsPct = rates.qs;
    existing.cfPct = rates.cf;
    existing.commPct = rates.comm;
    existing.bbPct = rates.boardsCharge || rates.bb;
    existing.ulaePct = rates.ulae;
    existing.xolPct = rates.xol;
    existing.lrCapPct = rates.lossRatioCap || rates.lr;
    existing.ibnrPct = rates.lossPick;
    return this.treatyRepo.save(existing);
  }

  async findAll(): Promise<Workbook[]> {
    return this.workbookRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  private async populateWorkbookRates(workbook: Workbook): Promise<void> {
    if (!workbook) return;
    const treaty = await this.treatyRepo.findOne({ where: { name: workbook.program } });
    if (treaty) {
      workbook.rates = {
        ...workbook.rates,
        qs: treaty.qsPct !== null ? Number(treaty.qsPct) : (workbook.rates?.qs ?? 100),
        cf: treaty.cfPct !== null ? Number(treaty.cfPct) : (workbook.rates?.cf ?? 5),
        comm: treaty.commPct !== null ? Number(treaty.commPct) : (workbook.rates?.comm ?? 29),
        bb: treaty.bbPct !== null ? Number(treaty.bbPct) : (workbook.rates?.bb ?? 0.4),
        ulae: treaty.ulaePct !== null ? Number(treaty.ulaePct) : (workbook.rates?.ulae ?? 7),
        xol: treaty.xolPct !== null ? Number(treaty.xolPct) : (workbook.rates?.xol ?? 0),
        lr: treaty.lrCapPct !== null ? Number(treaty.lrCapPct) : (workbook.rates?.lr ?? 2.0),
        
        lossPick: treaty.ibnrPct !== null ? Number(treaty.ibnrPct) : (workbook.rates?.lossPick ?? 5.0),
        boardsCharge: treaty.bbPct !== null ? Number(treaty.bbPct) : (workbook.rates?.boardsCharge ?? 0.4),
        lossRatioCap: treaty.lrCapPct !== null ? Number(treaty.lrCapPct) : (workbook.rates?.lossRatioCap ?? 2.0),
        laeDcc: workbook.rates?.laeDcc ?? 6.2,
        laeAoe: workbook.rates?.laeAoe ?? 0.0,
      };
    }
  }

  async findOne(id: number): Promise<Workbook> {
    let workbook = await this.workbookRepo.findOne({
      where: { id },
      relations: { stateExhibits: true, cashSettlement: true },
    });
    if (!workbook) {
      throw new NotFoundException(`Workbook with ID ${id} not found`);
    }

    await this.populateWorkbookRates(workbook);

    if (workbook.source === 'FUT') {
      await this.recalculateFUTReserves(id);
      const reloaded = await this.workbookRepo.findOne({
        where: { id },
        relations: { stateExhibits: true, cashSettlement: true },
      });
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

  async delete(id: number): Promise<void> {
    await this.workbookRepo.delete(id);
  }

  async updateStatus(id: number, status: string): Promise<Workbook> {
    const workbook = await this.findOne(id);
    workbook.status = status;
    const saved = await this.workbookRepo.save(workbook);
    await this.populateWorkbookRates(saved);
    return saved;
  }

  async uploadWorkbook(fileBuffer: Buffer, filename: string, forceOverwrite: boolean = false, program?: string): Promise<any> {
    let finalBuffer = fileBuffer;
    let finalFilename = filename;

    // Auto-detect and convert Starlight to ITD baseline if forceOverwrite (Add ITD) is triggered
    if (forceOverwrite) {
      try {
        const tempWb = XLSX.read(fileBuffer, { type: 'buffer' });
        const isStarlight = tempWb.SheetNames.some(
          (name) => name.toLowerCase().includes('starlight'),
        );
        if (isStarlight) {
          finalBuffer = await this.excelParserService.generateITDWorkbookFromStarlight(fileBuffer);
          finalFilename = `ITD_Seeder_${filename}`;
        }
      } catch (err) {
        console.warn('Starlight to ITD auto-detection failed:', err);
      }
    }

    const result = await this.excelParserService.parseWorkbook(finalBuffer, finalFilename, forceOverwrite, program);
    if (result && result.workbook && result.workbook.source === 'FUT') {
      await this.recalculateFUTReserves(result.workbook.id);
      result.workbook = await this.findOne(result.workbook.id);
    }
    return result;
  }

  async generateITDExcel(fileBuffer: Buffer, program?: string): Promise<Buffer> {
    return this.excelParserService.generateITDWorkbookFromStarlight(fileBuffer);
  }

  async updateMappings(workbookId: number, dto: any): Promise<Workbook> {
    const workbook = await this.findOne(workbookId);
    if (dto.mga !== undefined) workbook.mga = dto.mga;
    if (dto.lob !== undefined) workbook.lob = dto.lob;
    if (dto.lineDescSuffix !== undefined) workbook.lineDescSuffix = dto.lineDescSuffix;
    if (dto.comp !== undefined) workbook.comp = dto.comp;
    if (dto.cc !== undefined) workbook.cc = dto.cc;
    if (dto.ext !== undefined) workbook.ext = dto.ext;
    if (dto.sub !== undefined) workbook.sub = dto.sub;
    return this.workbookRepo.save(workbook);
  }

  async updateExhibit(workbookId: number, stateCode: string, dto: UpdateExhibitDto): Promise<StateExhibit> {
    const workbook = await this.findOne(workbookId);
    const exhibit = workbook.stateExhibits.find((e) => e.stateCode === stateCode);
    if (!exhibit) {
      throw new NotFoundException(`State exhibit ${stateCode} not found in workbook ${workbookId}`);
    }

    if (stateCode === 'TOTAL') {
      const fields = Object.keys(dto) as (keyof UpdateExhibitDto)[];
      const nonTotalExhibits = workbook.stateExhibits.filter((e) => e.stateCode !== 'TOTAL');
      
      fields.forEach((field) => {
        const totalValues = dto[field];
        if (totalValues !== undefined) {
          for (let c = 0; c < 3; c++) {
            const colTotal = Number(totalValues[c] || 0);
            
            const weights = nonTotalExhibits.map((ex) => {
              const existingVal = Number((ex as any)[field]?.[c] || 0);
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
              activeWeights = weights.map(w => w.isField ? w : { ...w, val: 0 });
            }

            const sumWeights = activeWeights.reduce((s, w) => s + Math.abs(w.val), 0);
            
            let distributedSum = 0;
            const stateValues = activeWeights.map((w) => {
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
              if (!(ex as any)[field]) {
                (ex as any)[field] = [0, 0, 0];
              }
              (ex as any)[field][c] = stateValues[idx];
            });
          }
        }
      });

      if (nonTotalExhibits.length > 0) {
        await this.stateExhibitRepo.save(nonTotalExhibits);
      }
    }

    Object.keys(dto).forEach((key) => {
      if ((dto as any)[key] !== undefined) {
        (exhibit as any)[key] = (dto as any)[key];
      }
    });

    const savedExhibit = await this.stateExhibitRepo.save(exhibit);
    if (workbook.source === 'FUT') {
      await this.recalculateFUTReserves(workbookId);
    } else {
      await this.recalculateTotalExhibit(workbookId);
    }
    const reloadedExhibit = await this.stateExhibitRepo.findOne({
      where: { workbookId, stateCode },
    });
    return reloadedExhibit || savedExhibit;
  }

  async updateRates(workbookId: number, dto: UpdateRatesDto): Promise<Workbook> {
    const workbook = await this.findOne(workbookId);
    workbook.rates = {
      ...workbook.rates,
      ...dto,
    };
    const savedWorkbook = await this.workbookRepo.save(workbook);
    if (savedWorkbook.source === 'FUT') {
      await this.recalculateFUTReserves(workbookId);
    }
    return this.findOne(workbookId);
  }

  async updateCashSettlement(workbookId: number, dto: UpdateCashSettlementDto): Promise<CashSettlement> {
    const workbook = await this.findOne(workbookId);
    if (!workbook.cashSettlement) {
      workbook.cashSettlement = this.cashSettlementRepo.create({
        workbookId,
        begBal: dto.begBal ?? 0,
        amtPaid: dto.amtPaid ?? 0,
      });
    } else {
      if (dto.begBal !== undefined) workbook.cashSettlement.begBal = dto.begBal;
      if (dto.amtPaid !== undefined) workbook.cashSettlement.amtPaid = dto.amtPaid;
    }
    return this.cashSettlementRepo.save(workbook.cashSettlement);
  }

  async findPreviousWorkbook(program: string, monthKey: string, source: string): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { program, monthKey, source },
      relations: { stateExhibits: true },
    });
  }

  async findPreviousWorkbookFor(workbook: Workbook): Promise<Workbook | null> {
    // 1. If it's January (monthKey ends with '-01'), look for ITD source workbook for the same program
    if (workbook.monthKey.endsWith('-01')) {
      const itdWb = await this.workbookRepo.findOne({
        where: { program: workbook.program, source: 'ITD' },
        relations: { stateExhibits: true },
        order: { createdAt: 'DESC' },
      });
      if (itdWb) return itdWb;
    }

    // 2. Otherwise, find workbook of the same program, same source, for the previous month key
    const prevMonthKey = this.getPreviousMonthKey(workbook.monthKey);
    let prevWb = await this.workbookRepo.findOne({
      where: { program: workbook.program, monthKey: prevMonthKey, source: workbook.source },
      relations: { stateExhibits: true },
    });
    if (prevWb) return prevWb;

    // 3. Fallback: try to find any source workbook for the previous month key
    prevWb = await this.workbookRepo.findOne({
      where: { program: workbook.program, monthKey: prevMonthKey },
      relations: { stateExhibits: true },
      order: { createdAt: 'DESC' },
    });
    if (prevWb) return prevWb;

    // 4. Fallback 2: if it's not January, but we are a FUT/Starlight workbook and have no other previous workbook,
    // default to the program's ITD workbook as the ultimate baseline
    if (workbook.source !== 'ITD') {
      const itdWb = await this.workbookRepo.findOne({
        where: { program: workbook.program, source: 'ITD' },
        relations: { stateExhibits: true },
        order: { createdAt: 'DESC' },
      });
      if (itdWb) return itdWb;
    }

    return null;
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

  async recalculateFUTReserves(workbookId: number): Promise<void> {
    const workbook = await this.workbookRepo.findOne({
      where: { id: workbookId },
      relations: { stateExhibits: true },
    });
    if (!workbook || workbook.source !== 'FUT') {
      return;
    }

    await this.populateWorkbookRates(workbook);

    const stateMaster = await this.workbookRepo.query('SELECT state_code, state_abbr FROM state_master');
    const stateMap = new Map<string, string>();
    for (const row of stateMaster) {
      stateMap.set(String(row.state_code), String(row.state_abbr));
      stateMap.set(String(row.state_abbr), String(row.state_code));
    }

    const prevWb = await this.findPreviousWorkbookFor(workbook);
    const prevSource = prevWb?.source;
    const prevStateExhibits = prevWb?.stateExhibits || [];

    const rates = workbook.rates || {};
    const lossPick = rates.lossPick ?? 51.8;
    const laeDcc = rates.laeDcc ?? 6.2;
    const laeAoe = rates.laeAoe ?? 0.0;

    const isDccActive = laeDcc > 0;
    const isAoeActive = laeAoe > 0;

    const nonTotalExhibits = workbook.stateExhibits.filter((e) => e.stateCode !== 'TOTAL');

    for (const ex of nonTotalExhibits) {
      const prevEx = prevStateExhibits.find((pe) => {
        if (pe.stateCode === ex.stateCode) return true;
        const mapped = stateMap.get(pe.stateCode);
        return mapped && mapped === ex.stateCode;
      });

      const pw = ex.pw || [0, 0, 0];
      const uep = ex.uep || [0, 0, 0];
      const lp = ex.lp || [0, 0, 0];
      const laep = ex.laep || [0, 0, 0];
      const lu = ex.lu || [0, 0, 0];
      const laeu = ex.laeu || [0, 0, 0];
      const aeu = ex.aeu || [0, 0, 0];

      const prev_uep = prevEx?.uep || [0, 0, 0];
      const prev_lu = prevEx?.lu || [0, 0, 0];
      const prev_laeu = prevEx?.laeu || [0, 0, 0];
      const prev_aeu = prevEx?.aeu || [0, 0, 0];

      const loss_reserves = [0, 0, 0];
      const loss_ibnr = [0, 0, 0];
      const lae_reserves_dcc = [0, 0, 0];
      const lae_ibnr_dcc = [0, 0, 0];
      const lae_reserves_aoe = [0, 0, 0];
      const lae_ibnr_aoe = [0, 0, 0];
      const ulae_ibnr = [0, 0, 0];

      for (let c = 0; c < 3; c++) {
        const pwVal = Number(pw[c] || 0);
        const currUEP = Number(uep[c] || 0);
        const lossesPaid = Number(lp[c] || 0);

        let dccPaid = 0;
        let aoePaid = 0;
        const rawLaep = Number(laep[c] || 0);
        if (isDccActive) {
          dccPaid = rawLaep;
          aoePaid = 0;
        } else if (isAoeActive) {
          aoePaid = rawLaep;
          dccPaid = 0;
        }

        let prevUEPVal = 0;
        let prevLossReservesVal = 0;
        let prevLossIBNRVal = 0;
        let prevDCCReservesVal = 0;
        let prevDCCIBNRVal = 0;
        let prevAOEReservesVal = 0;
        let prevAOEIBNRVal = 0;
        let prevULAEIBNRVal = 0;

        if (prevEx) {
          prevUEPVal = Number(prev_uep[c] || 0);
          if (prevSource === 'FUT') {
            const hasPrevDetailedReserves = prevEx && (
              prevEx.loss_ibnr?.some(v => Number(v) !== 0) ||
              prevEx.lae_ibnr_dcc?.some(v => Number(v) !== 0) ||
              prevEx.lae_ibnr_aoe?.some(v => Number(v) !== 0) ||
              prevEx.ulae_ibnr?.some(v => Number(v) !== 0)
            );

            if (hasPrevDetailedReserves) {
              prevLossReservesVal = Number(prevEx.loss_reserves?.[c] || 0);
              prevLossIBNRVal = Number(prevEx.loss_ibnr?.[c] || 0);
              prevULAEIBNRVal = Number(prevEx.ulae_ibnr?.[c] || 0);

              if (isDccActive) {
                prevDCCReservesVal = Number(prevEx.lae_reserves_dcc?.[c] || 0) + Number(prevEx.lae_reserves_aoe?.[c] || 0);
                prevDCCIBNRVal = Number(prevEx.lae_ibnr_dcc?.[c] || 0) + Number(prevEx.lae_ibnr_aoe?.[c] || 0);
                prevAOEReservesVal = 0;
                prevAOEIBNRVal = 0;
              } else if (isAoeActive) {
                prevAOEReservesVal = Number(prevEx.lae_reserves_aoe?.[c] || 0) + Number(prevEx.lae_reserves_dcc?.[c] || 0);
                prevAOEIBNRVal = Number(prevEx.lae_ibnr_aoe?.[c] || 0) + Number(prevEx.lae_ibnr_dcc?.[c] || 0);
                prevDCCReservesVal = 0;
                prevDCCIBNRVal = 0;
              }
            } else {
              prevLossReservesVal = 0;
              prevLossIBNRVal = Number(prev_lu[c] || 0);
              prevULAEIBNRVal = Number(prev_aeu[c] || 0);

              if (isDccActive) {
                prevDCCReservesVal = 0;
                prevDCCIBNRVal = Number(prev_laeu[c] || 0);
                prevAOEReservesVal = 0;
                prevAOEIBNRVal = 0;
              } else if (isAoeActive) {
                prevAOEReservesVal = 0;
                prevAOEIBNRVal = Number(prev_laeu[c] || 0);
                prevDCCReservesVal = 0;
                prevDCCIBNRVal = 0;
              }
            }
          } else {
            prevLossReservesVal = Number(prevEx.loss_reserves?.[c] || 0);
            prevLossIBNRVal = Number(prevEx.loss_ibnr?.[c] || 0);
            prevULAEIBNRVal = Number(prevEx.ulae_ibnr?.[c] || 0);

            if (isDccActive) {
              prevDCCReservesVal = Number(prevEx.lae_reserves_dcc?.[c] || 0) + Number(prevEx.lae_reserves_aoe?.[c] || 0);
              prevDCCIBNRVal = Number(prevEx.lae_ibnr_dcc?.[c] || 0) + Number(prevEx.lae_ibnr_aoe?.[c] || 0);
              prevAOEReservesVal = 0;
              prevAOEIBNRVal = 0;
            } else if (isAoeActive) {
              prevAOEReservesVal = Number(prevEx.lae_reserves_aoe?.[c] || 0) + Number(prevEx.lae_reserves_dcc?.[c] || 0);
              prevAOEIBNRVal = Number(prevEx.lae_ibnr_aoe?.[c] || 0) + Number(prevEx.lae_ibnr_dcc?.[c] || 0);
              prevDCCReservesVal = 0;
              prevDCCIBNRVal = 0;
            }
          }
        }

        const changeUEP = prevUEPVal - currUEP;
        const premiumsEarned = pwVal + changeUEP;

        const currLossReservesVal = Number(lu[c] || 0);
        let currDCCReservesVal = 0;
        let currAOEReservesVal = 0;

        if (isDccActive) {
          currDCCReservesVal = Number(laeu[c] || 0) + Number(aeu[c] || 0);
          currAOEReservesVal = 0;
        } else if (isAoeActive) {
          currAOEReservesVal = Number(laeu[c] || 0) + Number(aeu[c] || 0);
          currDCCReservesVal = 0;
        }

        const ultimateLoss = premiumsEarned * (lossPick / 100);
        const ultimateLAEDcc = premiumsEarned * (laeDcc / 100);
        const ultimateLAEAoe = premiumsEarned * (laeAoe / 100);

        const changeLossReserves = currLossReservesVal - prevLossReservesVal;
        const changeLossIBNR = ultimateLoss - lossesPaid - changeLossReserves;
        const currLossIBNRVal = prevLossIBNRVal + changeLossIBNR;

        const changeDCCReserves = currDCCReservesVal - prevDCCReservesVal;
        const changeDCCIBNR = ultimateLAEDcc - dccPaid - changeDCCReserves;
        const currDCCIBNRVal = prevDCCIBNRVal + changeDCCIBNR;

        const changeAOEReserves = currAOEReservesVal - prevAOEReservesVal;
        const changeAOEIBNR = ultimateLAEAoe - aoePaid - changeAOEReserves;
        const currAOEIBNRVal = prevAOEIBNRVal + changeAOEIBNR;

        const changeULAEIBNR = (0.5 * changeLossReserves + changeLossIBNR) * 0.005;
        const currULAEIBNRVal = prevULAEIBNRVal + changeULAEIBNR;

        loss_reserves[c] = Number(currLossReservesVal.toFixed(2));
        loss_ibnr[c] = Number(currLossIBNRVal.toFixed(2));
        lae_reserves_dcc[c] = Number((isDccActive ? currDCCReservesVal : 0).toFixed(2));
        lae_ibnr_dcc[c] = Number((isDccActive ? currDCCIBNRVal : 0).toFixed(2));
        lae_reserves_aoe[c] = Number((isAoeActive ? currAOEReservesVal : 0).toFixed(2));
        lae_ibnr_aoe[c] = Number((isAoeActive ? currAOEIBNRVal : 0).toFixed(2));
        ulae_ibnr[c] = Number(currULAEIBNRVal.toFixed(2));
      }

      ex.loss_reserves = loss_reserves;
      ex.loss_ibnr = loss_ibnr;
      ex.lae_reserves_dcc = lae_reserves_dcc;
      ex.lae_ibnr_dcc = lae_ibnr_dcc;
      ex.lae_reserves_aoe = lae_reserves_aoe;
      ex.lae_ibnr_aoe = lae_ibnr_aoe;
      ex.ulae_ibnr = ulae_ibnr;
    }

    await this.stateExhibitRepo.save(nonTotalExhibits);
    await this.recalculateTotalExhibit(workbookId);
  }

  private async recalculateTotalExhibit(workbookId: number): Promise<void> {
    const allExhibits = await this.stateExhibitRepo.find({ where: { workbookId } });
    const nonTotalExhibits = allExhibits.filter((e) => e.stateCode !== 'TOTAL');
    let totalExhibit = allExhibits.find((e) => e.stateCode === 'TOTAL');

    if (!totalExhibit) {
      totalExhibit = this.stateExhibitRepo.create({
        workbookId,
        stateCode: 'TOTAL',
      });
    }

    const fields = [
      'pw', 'pfw', 'pc', 'pfc', 'tax', 'lp', 'laep', 'ae_paid',
      'pe', 'pfe', 'uep', 'lu', 'laeu', 'aeu',
      'loss_reserves', 'loss_ibnr', 'lae_reserves_dcc', 'lae_ibnr_dcc',
      'lae_reserves_aoe', 'lae_ibnr_aoe', 'ulae_ibnr'
    ];

    fields.forEach((field) => {
      const sums = [0, 0, 0];
      nonTotalExhibits.forEach((ex) => {
        const arr = (ex as any)[field] || [];
        for (let i = 0; i < 3; i++) {
          sums[i] += Number(arr[i] || 0);
        }
      });
      (totalExhibit as any)[field] = sums.map((s) => Number(s.toFixed(2)));
    });

    await this.stateExhibitRepo.save(totalExhibit);
  }

  async createManualITD(dto: any): Promise<Workbook> {
    const { program, monthKey, monthLabel, exhibits } = dto;
    const source = 'ITD';

    // Check if workbook exists
    const existing = await this.workbookRepo.findOne({
      where: { program, monthKey, source },
    });
    if (existing) {
      await this.workbookRepo.remove(existing);
    }

    const treaty = await this.treatyRepo.findOne({ where: { name: program } });
    const rates = {
      qs: treaty?.qsPct !== null ? Number(treaty.qsPct) : 100,
      cf: treaty?.cfPct !== null ? Number(treaty.cfPct) : 5,
      comm: treaty?.commPct !== null ? Number(treaty.commPct) : 29,
      bb: treaty?.bbPct !== null ? Number(treaty.bbPct) : 0.4,
      ulae: treaty?.ulaePct !== null ? Number(treaty.ulaePct) : 7,
      xol: treaty?.xolPct !== null ? Number(treaty.xolPct) : 0,
      lr: treaty?.lrCapPct !== null ? Number(treaty.lrCapPct) : 2.0,
      
      lossPick: treaty?.ibnrPct !== null ? Number(treaty.ibnrPct) : 5.0,
      boardsCharge: treaty?.bbPct !== null ? Number(treaty.bbPct) : 0.4,
      lossRatioCap: treaty?.lrCapPct !== null ? Number(treaty.lrCapPct) : 2.0,
      laeDcc: 6.2,
      laeAoe: 0.0,
    };

    const workbook = this.workbookRepo.create({
      program,
      monthKey,
      monthLabel,
      source,
      rates,
      ...this.excelParserService.getDefaultMappings(program),
    });

    const savedWorkbook = await this.workbookRepo.save(workbook);

    const savedExhibits: StateExhibit[] = [];
    for (const ex of exhibits) {
      const stateEx = this.stateExhibitRepo.create({
        workbookId: savedWorkbook.id,
        stateCode: ex.state_code.toUpperCase(),
        pw: ex.pw || [0, 0, 0],
        pfw: ex.pfw || [0, 0, 0],
        pc: ex.pc || [0, 0, 0],
        pfc: ex.pfc || [0, 0, 0],
        tax: ex.tax || [0, 0, 0],
        lp: ex.lp || [0, 0, 0],
        laep: ex.laep || [0, 0, 0],
        ae_paid: ex.ae_paid || [0, 0, 0],
        pe: ex.pe || [0, 0, 0],
        pfe: ex.pfe || [0, 0, 0],
        uep: ex.uep || [0, 0, 0],
        lu: ex.lu || [0, 0, 0],
        laeu: ex.laeu || [0, 0, 0],
        aeu: ex.aeu || [0, 0, 0],
        loss_reserves: ex.loss_reserves || [0, 0, 0],
        loss_ibnr: ex.loss_ibnr || [0, 0, 0],
        lae_reserves_dcc: ex.lae_reserves_dcc || [0, 0, 0],
        lae_ibnr_dcc: ex.lae_ibnr_dcc || [0, 0, 0],
        lae_reserves_aoe: ex.lae_reserves_aoe || [0, 0, 0],
        lae_ibnr_aoe: ex.lae_ibnr_aoe || [0, 0, 0],
        ulae_ibnr: ex.ulae_ibnr || [0, 0, 0],
      });
      savedExhibits.push(stateEx);
    }
    await this.stateExhibitRepo.save(savedExhibits);
    await this.recalculateTotalExhibit(savedWorkbook.id);

    return this.findOne(savedWorkbook.id);
  }
}
