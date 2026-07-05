import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RiskCompaniesDao } from './dao/risk-companies.dao';
import { RiskCompany } from '../entities/risk-company.entity';
import { RiskCompanyDocument } from '../entities/risk-company-document.entity';
import { CreateRiskCompanyDto, UpdateRiskCompanyDto } from '../dto/risk-company.dto';

/** CRUD for risk company master records, including risk-company-level documents. */
@Injectable()
export class RiskCompaniesService {
  constructor(private readonly dao: RiskCompaniesDao) {}

  async findAllRiskCompanies(search?: string, isActive?: boolean): Promise<RiskCompany[]> {
    return this.dao.findAll(search, isActive);
  }

  async findOneRiskCompany(
    id: string,
  ): Promise<RiskCompany & { documents: RiskCompanyDocument[] }> {
    const rc = await this.dao.findById(id);
    if (!rc) throw new NotFoundException('Risk Company not found');
    const documents = await this.dao.findDocumentsByRiskCompanyId(id);
    return { ...rc, documents };
  }

  async createRiskCompany(dto: CreateRiskCompanyDto, userId: string): Promise<RiskCompany> {
    const exists = await this.dao.findByRiskCompanyId(dto.risk_company_id);
    if (exists)
      throw new BadRequestException(`Risk Company ID ${dto.risk_company_id} already exists`);

    const rc = this.dao.create({
      riskCompanyId: dto.risk_company_id,
      companyId: dto.company_id ?? null,
      idName: dto.id_name ?? null,
      name: dto.name,
      phone: dto.phone ?? null,
      isAdmitted: dto.is_admitted ?? true,
      state: dto.state ?? null,
      address: dto.address ?? null,
      zip: dto.zip ?? null,
      city: dto.city ?? null,
      notes: dto.notes ?? null,
      isActive: dto.is_active ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.dao.save(rc);
  }

  async updateRiskCompany(
    id: string,
    dto: UpdateRiskCompanyDto,
    userId: string,
  ): Promise<RiskCompany> {
    const rc = await this.dao.findById(id);
    if (!rc) throw new NotFoundException('Risk Company not found');

    if (dto.risk_company_id !== undefined && dto.risk_company_id !== rc.riskCompanyId) {
      const exists = await this.dao.findByRiskCompanyId(dto.risk_company_id);
      if (exists)
        throw new BadRequestException(`Risk Company ID ${dto.risk_company_id} already exists`);
    }

    Object.assign(rc, {
      riskCompanyId: dto.risk_company_id ?? rc.riskCompanyId,
      companyId: dto.company_id ?? rc.companyId,
      idName: dto.id_name ?? rc.idName,
      name: dto.name ?? rc.name,
      phone: dto.phone ?? rc.phone,
      isAdmitted: dto.is_admitted ?? rc.isAdmitted,
      state: dto.state ?? rc.state,
      address: dto.address ?? rc.address,
      zip: dto.zip ?? rc.zip,
      city: dto.city ?? rc.city,
      notes: dto.notes ?? rc.notes,
      isActive: dto.is_active ?? rc.isActive,
      updatedBy: userId,
    });
    return this.dao.save(rc);
  }

  async deleteRiskCompany(id: string): Promise<void> {
    const rc = await this.dao.findById(id);
    if (!rc) throw new NotFoundException('Risk Company not found');
    await this.dao.delete(id);
  }

  async addRiskCompanyDocument(
    riskCompanyId: string,
    fileName: string,
    fileUrl: string,
    documentType: string,
    userId: string,
  ): Promise<RiskCompanyDocument> {
    const rc = await this.dao.findById(riskCompanyId);
    if (!rc) throw new NotFoundException('Risk Company not found');

    const doc = this.dao.createDocument({
      riskCompanyId,
      fileName,
      fileUrl,
      documentType,
      uploadedBy: userId,
    });
    return this.dao.saveDocument(doc);
  }

  async findRiskCompanyDocument(id: string): Promise<RiskCompanyDocument> {
    const doc = await this.dao.findDocumentById(id);
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async deleteRiskCompanyDocument(id: string): Promise<void> {
    const doc = await this.dao.findDocumentById(id);
    if (!doc) throw new NotFoundException('Document not found');
    await this.dao.deleteDocument(id);
  }
}
