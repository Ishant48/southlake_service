import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../entities/workbook.entity';
import { StateExhibit } from '../../entities/state-exhibit.entity';
import { Treaty } from '../../../masters/entities/treaty.entity';

export interface StateMasterRow {
  state_code: string;
  state_abbr: string;
}

@Injectable()
export class FutReservesDao {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
    @InjectRepository(StateExhibit)
    private readonly stateExhibitRepo: Repository<StateExhibit>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  findWorkbookWithExhibits(workbookId: number): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { id: workbookId },
      relations: { stateExhibits: true },
    });
  }

  findTreatyByName(name: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({ where: { name } });
  }

  queryStateMaster(): Promise<StateMasterRow[]> {
    return this.workbookRepo.query('SELECT state_code, state_abbr FROM state_master');
  }

  saveExhibit(exhibit: StateExhibit): Promise<StateExhibit> {
    return this.stateExhibitRepo.save(exhibit);
  }
}
