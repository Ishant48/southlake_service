import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccount } from '../entities/chart-of-account.entity';
import { ChartOfAccountDocument } from '../entities/chart-of-account-document.entity';

@Injectable()
export class ChartOfAccountsDao {
  constructor(
    @InjectRepository(ChartOfAccount)
    private readonly coaRepo: Repository<ChartOfAccount>,
    @InjectRepository(ChartOfAccountDocument)
    private readonly docRepo: Repository<ChartOfAccountDocument>,
  ) {}

  findAll(where: Record<string, unknown>): Promise<ChartOfAccount[]> {
    return this.coaRepo.find({
      where,
      order: { accountCode: 'ASC' },
      relations: ['parent', 'earningAccount'],
    });
  }

  findById(id: string): Promise<ChartOfAccount | null> {
    return this.coaRepo.findOne({
      where: { id },
      relations: ['parent', 'earningAccount'],
    });
  }

  findByAccountCode(accountCode: number): Promise<ChartOfAccount | null> {
    return this.coaRepo.findOne({ where: { accountCode } });
  }

  findByKey(key: string): Promise<ChartOfAccount | null> {
    return this.coaRepo.findOne({ where: { key } });
  }

  findChildren(parentId: string): Promise<ChartOfAccount[]> {
    return this.coaRepo.find({ where: { parentId } });
  }

  create(data: Partial<ChartOfAccount>): ChartOfAccount {
    return this.coaRepo.create(data);
  }

  save(coa: ChartOfAccount): Promise<ChartOfAccount> {
    return this.coaRepo.save(coa);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.coaRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.coaRepo.save(entity);
  }

  findDocumentsByCoaId(coaId: string): Promise<ChartOfAccountDocument[]> {
    return this.docRepo.find({
      where: { coaId },
      order: { uploadedAt: 'DESC' },
    });
  }

  createDocument(data: Partial<ChartOfAccountDocument>): ChartOfAccountDocument {
    return this.docRepo.create(data);
  }

  saveDocument(doc: ChartOfAccountDocument): Promise<ChartOfAccountDocument> {
    return this.docRepo.save(doc);
  }

  findDocumentById(id: string): Promise<ChartOfAccountDocument | null> {
    return this.docRepo.findOne({ where: { id } });
  }

  async deleteDocument(id: string): Promise<void> {
    const entity = await this.docRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.docRepo.save(entity);
  }
}
