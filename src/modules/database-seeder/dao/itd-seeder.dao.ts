import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../workbook/entities/workbook.entity';
import { StateExhibit } from '../../workbook/entities/state-exhibit.entity';
import { CashSettlement } from '../../workbook/entities/cash-settlement.entity';
import { Treaty } from '../../masters/entities/treaty.entity';

@Injectable()
export class ItdSeederDao {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
    @InjectRepository(StateExhibit)
    private readonly stateExhibitRepo: Repository<StateExhibit>,
    @InjectRepository(CashSettlement)
    private readonly cashSettlementRepo: Repository<CashSettlement>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  async deleteAllWorkbooks(): Promise<{ affected: number }> {
    const all = await this.workbookRepo.find();
    if (!all.length) return { affected: 0 };
    const now = new Date();
    for (const wb of all) {
      wb.isDeleted = true;
      wb.deletedAt = now;
    }
    await this.workbookRepo.save(all);
    return { affected: all.length };
  }

  findWorkbookByProgramSourceIn(
    conditions: Array<{ program: string; source: string }>,
  ): Promise<Workbook | null> {
    return this.workbookRepo.findOne({ where: conditions });
  }

  findTreatyByName(name: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({ where: { name } });
  }

  createTreaty(data: Partial<Treaty>): Treaty {
    return this.treatyRepo.create(data);
  }

  saveTreaty(treaty: Treaty): Promise<Treaty> {
    return this.treatyRepo.save(treaty);
  }

  findWorkbooksByProgramAndSource(program: string, source: string): Promise<Workbook[]> {
    return this.workbookRepo.find({ where: { program, source } });
  }

  removeWorkbooks(workbooks: Workbook[]): Promise<Workbook[]> {
    const now = new Date();
    for (const wb of workbooks) {
      wb.isDeleted = true;
      wb.deletedAt = now;
    }
    return this.workbookRepo.save(workbooks);
  }

  createWorkbook(data: Partial<Workbook>): Workbook {
    return this.workbookRepo.create(data);
  }

  saveWorkbook(workbook: Workbook): Promise<Workbook> {
    return this.workbookRepo.save(workbook);
  }

  createStateExhibit(data: Partial<StateExhibit>): StateExhibit {
    return this.stateExhibitRepo.create(data);
  }

  saveStateExhibits(exhibits: StateExhibit[]): Promise<StateExhibit[]>;
  saveStateExhibits(exhibit: StateExhibit): Promise<StateExhibit>;
  saveStateExhibits(
    exhibits: StateExhibit[] | StateExhibit,
  ): Promise<StateExhibit[] | StateExhibit> {
    if (Array.isArray(exhibits)) {
      return this.stateExhibitRepo.save(exhibits);
    }
    return this.stateExhibitRepo.save(exhibits);
  }

  createCashSettlement(data: Partial<CashSettlement>): CashSettlement {
    return this.cashSettlementRepo.create(data);
  }

  saveCashSettlement(cashSettlement: CashSettlement): Promise<CashSettlement> {
    return this.cashSettlementRepo.save(cashSettlement);
  }

  findWorkbookByIdWithExhibits(id: number): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { id },
      relations: { stateExhibits: true },
    });
  }

  findWorkbookBySourceWithExhibits(source: string): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { source },
      relations: { stateExhibits: true },
    });
  }

  findWorkbookByProgramAndSourceWithExhibits(
    program: string,
    source: string,
  ): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { program, source },
      relations: { stateExhibits: true },
    });
  }

  findWorkbooksBySourceWithExhibits(source: string): Promise<Workbook[]> {
    return this.workbookRepo.find({
      where: { source },
      relations: { stateExhibits: true },
    });
  }

  findStateExhibitsByWorkbookId(workbookId: number): Promise<StateExhibit[]> {
    return this.stateExhibitRepo.find({ where: { workbookId } });
  }
}
