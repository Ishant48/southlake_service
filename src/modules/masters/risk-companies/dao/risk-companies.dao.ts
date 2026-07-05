import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { RiskCompany } from '../../entities/risk-company.entity';
import { RiskCompanyDocument } from '../../entities/risk-company-document.entity';

@Injectable()
export class RiskCompaniesDao {
  constructor(
    @InjectRepository(RiskCompany)
    private readonly riskCompanyRepo: Repository<RiskCompany>,
    @InjectRepository(RiskCompanyDocument)
    private readonly riskCompanyDocRepo: Repository<RiskCompanyDocument>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<RiskCompany[]> {
    const where: FindOptionsWhere<RiskCompany>[] = [];
    if (search) {
      where.push({ name: ILike(`%${search}%`), isActive });
      where.push({ riskCompanyId: ILike(`%${search}%`), isActive });
      where.push({ idName: ILike(`%${search}%`), isActive });
    } else {
      const obj: FindOptionsWhere<RiskCompany> = {};
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.riskCompanyRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { riskCompanyId: 'ASC' },
    });
  }

  findById(id: string): Promise<RiskCompany | null> {
    return this.riskCompanyRepo.findOne({ where: { id } });
  }

  findByRiskCompanyId(riskCompanyId: string): Promise<RiskCompany | null> {
    return this.riskCompanyRepo.findOne({ where: { riskCompanyId } });
  }

  create(data: Partial<RiskCompany>): RiskCompany {
    return this.riskCompanyRepo.create(data);
  }

  save(rc: RiskCompany): Promise<RiskCompany> {
    return this.riskCompanyRepo.save(rc);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.riskCompanyRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.riskCompanyRepo.save(entity);
  }

  findDocumentsByRiskCompanyId(riskCompanyId: string): Promise<RiskCompanyDocument[]> {
    return this.riskCompanyDocRepo.find({
      where: { riskCompanyId },
      order: { uploadedAt: 'DESC' },
    });
  }

  findDocumentById(id: string): Promise<RiskCompanyDocument | null> {
    return this.riskCompanyDocRepo.findOne({ where: { id } });
  }

  createDocument(data: Partial<RiskCompanyDocument>): RiskCompanyDocument {
    return this.riskCompanyDocRepo.create(data);
  }

  saveDocument(doc: RiskCompanyDocument): Promise<RiskCompanyDocument> {
    return this.riskCompanyDocRepo.save(doc);
  }

  async deleteDocument(id: string): Promise<void> {
    const entity = await this.riskCompanyDocRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.riskCompanyDocRepo.save(entity);
  }
}
