import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { MgaMaster } from '../../entities/mga-master.entity';
import { MgaDocument } from '../../entities/mga-document.entity';
import { TreatyMga } from '../../entities/treaty-mga.entity';
import { Treaty } from '../../entities/treaty.entity';

@Injectable()
export class MgasDao {
  constructor(
    @InjectRepository(MgaMaster)
    private readonly mgaRepo: Repository<MgaMaster>,
    @InjectRepository(MgaDocument)
    private readonly mgaDocRepo: Repository<MgaDocument>,
    @InjectRepository(TreatyMga)
    private readonly treatyMgaRepo: Repository<TreatyMga>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<MgaMaster[]> {
    const where: FindOptionsWhere<MgaMaster>[] = [];
    if (search) {
      where.push({ name: ILike(`%${search}%`), ...(isActive !== undefined ? { isActive } : {}) });
      where.push({
        mgaCode: ILike(`%${search}%`),
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<MgaMaster> = {};
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.mgaRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { mgaCode: 'ASC' },
    });
  }

  findById(id: string): Promise<MgaMaster | null> {
    return this.mgaRepo.findOne({ where: { id } });
  }

  findByCode(mgaCode: string): Promise<MgaMaster | null> {
    return this.mgaRepo.findOne({ where: { mgaCode } });
  }

  create(data: Partial<MgaMaster>): MgaMaster {
    return this.mgaRepo.create(data);
  }

  save(mga: MgaMaster): Promise<MgaMaster> {
    return this.mgaRepo.save(mga);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.mgaRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.mgaRepo.save(entity);
  }

  findDocumentsByMgaId(mgaId: string): Promise<MgaDocument[]> {
    return this.mgaDocRepo.find({ where: { mgaId }, order: { uploadedAt: 'DESC' } });
  }

  findDocumentById(id: string): Promise<MgaDocument | null> {
    return this.mgaDocRepo.findOne({ where: { id } });
  }

  createDocument(data: Partial<MgaDocument>): MgaDocument {
    return this.mgaDocRepo.create(data);
  }

  saveDocument(doc: MgaDocument): Promise<MgaDocument> {
    return this.mgaDocRepo.save(doc);
  }

  async deleteDocument(id: string): Promise<void> {
    const entity = await this.mgaDocRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.mgaDocRepo.save(entity);
  }

  findTreatyById(id: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({ where: { id } });
  }

  findTreatyMgaLink(treatyId: string, mgaId: string): Promise<TreatyMga | null> {
    return this.treatyMgaRepo.findOne({ where: { treatyId, mgaId } });
  }

  createTreatyMgaLink(data: Partial<TreatyMga>): TreatyMga {
    return this.treatyMgaRepo.create(data);
  }

  saveTreatyMgaLink(link: TreatyMga): Promise<TreatyMga> {
    return this.treatyMgaRepo.save(link);
  }

  saveTreaty(treaty: Treaty): Promise<Treaty> {
    return this.treatyRepo.save(treaty);
  }
}
