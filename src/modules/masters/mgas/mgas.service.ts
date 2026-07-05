import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { MgasDao } from './dao/mgas.dao';
import { MgaMaster } from '../entities/mga-master.entity';
import { MgaDocument } from '../entities/mga-document.entity';
import { CreateMgaDto, UpdateMgaDto } from '../dto/mga.dto';

/** CRUD for MGA master records, including MGA-level documents and treaty associations. */
@Injectable()
export class MgasService {
  constructor(
    private readonly dao: MgasDao,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAllMgas(search?: string, isActive?: boolean): Promise<MgaMaster[]> {
    return this.dao.findAll(search, isActive);
  }

  async findOneMga(id: string): Promise<MgaMaster & { documents: MgaDocument[] }> {
    const mga = await this.dao.findById(id);
    if (!mga) throw new NotFoundException('MGA not found');
    const documents = await this.dao.findDocumentsByMgaId(id);
    return { ...mga, documents };
  }

  async createMga(dto: CreateMgaDto, userId: string): Promise<MgaMaster> {
    const exists = await this.dao.findByCode(dto.mga_code);
    if (exists) throw new BadRequestException(`MGA code ${dto.mga_code} already exists`);

    const mga = this.dao.create({
      mgaCode: dto.mga_code,
      name: dto.name,
      taxPayableInhouse: dto.tax_payable_inhouse ?? false,
      isActive: dto.is_active ?? true,
      ledgerAmount: dto.ledger_amount ?? 0.0,
      companyId: dto.company_id ? String(dto.company_id) : null,
      idName: dto.id_name ?? null,
      address: dto.address ?? null,
      zip: dto.zip ?? null,
      city: dto.city ?? null,
      state: dto.state ?? null,
      phone: dto.phone ?? null,
      openItem: dto.open_item ?? false,
      opStartDate: dto.op_start_date ?? null,
      otherNames: dto.other_names ?? null,
      naicsCode: dto.naics_code ?? null,
      contactName: dto.contact_name ?? null,
      contactEmail: dto.contact_email ?? null,
      contactPhone: dto.contact_phone ?? null,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.dao.save(mga);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'create',
      entityType: 'mga',
      entityId: saved.id,
      description: `Created MGA master ${saved.name} (${saved.mgaCode})`,
    });
    return saved;
  }

  async updateMga(id: string, dto: UpdateMgaDto, userId: string): Promise<MgaMaster> {
    const mga = await this.dao.findById(id);
    if (!mga) throw new NotFoundException('MGA not found');

    if (dto.mga_code !== undefined && dto.mga_code !== mga.mgaCode) {
      const exists = await this.dao.findByCode(dto.mga_code);
      if (exists) throw new BadRequestException(`MGA code ${dto.mga_code} already exists`);
    }

    Object.assign(mga, {
      mgaCode: dto.mga_code ?? mga.mgaCode,
      name: dto.name ?? mga.name,
      taxPayableInhouse: dto.tax_payable_inhouse ?? mga.taxPayableInhouse,
      isActive: dto.is_active ?? mga.isActive,
      ledgerAmount: dto.ledger_amount ?? mga.ledgerAmount,
      companyId:
        dto.company_id !== undefined
          ? dto.company_id
            ? String(dto.company_id)
            : null
          : mga.companyId,
      idName: dto.id_name ?? mga.idName,
      address: dto.address ?? mga.address,
      zip: dto.zip ?? mga.zip,
      city: dto.city ?? mga.city,
      state: dto.state ?? mga.state,
      phone: dto.phone ?? mga.phone,
      openItem: dto.open_item ?? mga.openItem,
      opStartDate: dto.op_start_date ?? mga.opStartDate,
      otherNames: dto.other_names ?? mga.otherNames,
      naicsCode: dto.naics_code ?? mga.naicsCode,
      contactName: dto.contact_name ?? mga.contactName,
      contactEmail: dto.contact_email ?? mga.contactEmail,
      contactPhone: dto.contact_phone ?? mga.contactPhone,
      updatedBy: userId,
    });
    const saved = await this.dao.save(mga);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'edit',
      entityType: 'mga',
      entityId: saved.id,
      description: `Updated MGA master ${saved.name} (${saved.mgaCode})`,
    });
    return saved;
  }

  async deleteMga(id: string, userId?: string): Promise<void> {
    const mga = await this.dao.findById(id);
    if (!mga) throw new NotFoundException('MGA not found');
    await this.dao.delete(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'delete',
      entityType: 'mga',
      entityId: id,
      description: `Deleted MGA master ${mga.name} (${mga.mgaCode})`,
    });
  }

  async addMgaDocument(
    mgaId: string,
    fileName: string,
    fileUrl: string,
    documentType: string,
    userId: string,
  ): Promise<MgaDocument> {
    const mga = await this.dao.findById(mgaId);
    if (!mga) throw new NotFoundException('MGA not found');

    const doc = this.dao.createDocument({
      mgaId,
      fileName,
      fileUrl,
      documentType,
      uploadedBy: userId,
    });
    return this.dao.saveDocument(doc);
  }

  async findMgaDocument(id: string): Promise<MgaDocument> {
    const doc = await this.dao.findDocumentById(id);
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async deleteMgaDocument(id: string): Promise<void> {
    const doc = await this.dao.findDocumentById(id);
    if (!doc) throw new NotFoundException('Document not found');
    await this.dao.deleteDocument(id);
  }

  async addMgaToTreaties(
    mgaId: string,
    treatyIds: string[],
    userId: string,
  ): Promise<{ success: boolean }> {
    const mga = await this.dao.findById(mgaId);
    if (!mga) throw new NotFoundException('MGA not found');

    for (const treatyId of treatyIds) {
      const treaty = await this.dao.findTreatyById(treatyId);
      if (!treaty) continue;

      const exists = await this.dao.findTreatyMgaLink(treatyId, mgaId);
      if (!exists) {
        const link = this.dao.createTreatyMgaLink({ treatyId, mgaId });
        await this.dao.saveTreatyMgaLink(link);
      }

      if (!treaty.mgaId) {
        treaty.mgaId = mgaId;
        treaty.updatedBy = userId;
        await this.dao.saveTreaty(treaty);
      }
    }

    return { success: true };
  }
}
