import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { StateMaster } from '../../entities/state-master.entity';
import { StateDocument } from '../../entities/state-document.entity';

@Injectable()
export class StatesDao {
  constructor(
    @InjectRepository(StateMaster)
    private readonly stateRepo: Repository<StateMaster>,
    @InjectRepository(StateDocument)
    private readonly stateDocRepo: Repository<StateDocument>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<StateMaster[]> {
    const where: FindOptionsWhere<StateMaster>[] = [];
    if (search) {
      where.push({ name: ILike(`%${search}%`), isActive });
      where.push({ stateAbbr: ILike(`%${search}%`), isActive });
    } else {
      const obj: FindOptionsWhere<StateMaster> = {};
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.stateRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { stateCode: { direction: 'ASC', nulls: 'LAST' } },
    });
  }

  findById(id: string): Promise<StateMaster | null> {
    return this.stateRepo.findOne({ where: { id } });
  }

  findByAbbr(stateAbbr: string): Promise<StateMaster | null> {
    return this.stateRepo.findOne({ where: { stateAbbr } });
  }

  findByCode(stateCode: number): Promise<StateMaster | null> {
    return this.stateRepo.findOne({ where: { stateCode } });
  }

  create(data: Partial<StateMaster>): StateMaster {
    return this.stateRepo.create(data);
  }

  save(state: StateMaster): Promise<StateMaster> {
    return this.stateRepo.save(state);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.stateRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.stateRepo.save(entity);
  }

  findDocumentsByStateId(stateId: string): Promise<StateDocument[]> {
    return this.stateDocRepo.find({ where: { stateId }, order: { uploadedAt: 'DESC' } });
  }

  findDocumentById(id: string): Promise<StateDocument | null> {
    return this.stateDocRepo.findOne({ where: { id } });
  }

  createDocument(data: Partial<StateDocument>): StateDocument {
    return this.stateDocRepo.create(data);
  }

  saveDocument(doc: StateDocument): Promise<StateDocument> {
    return this.stateDocRepo.save(doc);
  }

  async deleteDocument(id: string): Promise<void> {
    const entity = await this.stateDocRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.stateDocRepo.save(entity);
  }
}
