import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../entities/workbook.entity';
import { StateExhibit } from '../../entities/state-exhibit.entity';
import { CashSettlement } from '../../entities/cash-settlement.entity';

@Injectable()
export class WorkbookUpdatesDao {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
    @InjectRepository(StateExhibit)
    private readonly stateExhibitRepo: Repository<StateExhibit>,
    @InjectRepository(CashSettlement)
    private readonly cashSettlementRepo: Repository<CashSettlement>,
  ) {}

  saveWorkbook(workbook: Workbook): Promise<Workbook> {
    return this.workbookRepo.save(workbook);
  }

  saveExhibit(exhibit: StateExhibit): Promise<StateExhibit> {
    return this.stateExhibitRepo.save(exhibit);
  }

  saveExhibits(exhibits: StateExhibit[]): Promise<StateExhibit[]> {
    return this.stateExhibitRepo.save(exhibits);
  }

  findExhibit(workbookId: number, stateCode: string): Promise<StateExhibit | null> {
    return this.stateExhibitRepo.findOne({ where: { workbookId, stateCode } });
  }

  createCashSettlement(data: Partial<CashSettlement>): CashSettlement {
    return this.cashSettlementRepo.create(data);
  }

  saveCashSettlement(cs: CashSettlement): Promise<CashSettlement> {
    return this.cashSettlementRepo.save(cs);
  }
}
