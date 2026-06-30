import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { StateMaster } from '../../entities/state-master.entity';
import { MgaMaster } from '../../entities/mga-master.entity';
import { MgaDocument } from '../../entities/mga-document.entity';
import { ReinsurerCompany } from '../../entities/reinsurer-company.entity';
import { RiskCompany } from '../../entities/risk-company.entity';
import { LineOfBusiness } from '../../entities/line-of-business.entity';
import { CobMaster } from '../../entities/cob-master.entity';
import { Treaty } from '../../entities/treaty.entity';
import { TreatyLob } from '../../entities/treaty-lob.entity';
import { TreatyLobCob } from '../../entities/treaty-lob-cob.entity';
import { TreatyState } from '../../entities/treaty-state.entity';
import { StateDocument } from '../../entities/state-document.entity';
import { RiskCompanyDocument } from '../../entities/risk-company-document.entity';
import { TreatyMga } from '../../entities/treaty-mga.entity';
import { TreatyCarrier } from '../../entities/treaty-carrier.entity';
import { TreatyReinsurer } from '../../entities/treaty-reinsurer.entity';

import { CreateStateDto, UpdateStateDto } from './dto/state.dto';
import { CreateMgaDto, UpdateMgaDto } from './dto/mga.dto';
import { CreateReinsurerDto, UpdateReinsurerDto } from './dto/reinsurer.dto';
import { CreateRiskCompanyDto, UpdateRiskCompanyDto } from './dto/risk-company.dto';
import { CreateLobDto, UpdateLobDto } from './dto/lob.dto';
import { CreateCobDto, UpdateCobDto } from './dto/cob.dto';
import { CreateTreatyDto, UpdateTreatyDto } from './dto/treaty.dto';

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(StateMaster)
    private readonly stateRepo: Repository<StateMaster>,
    @InjectRepository(MgaMaster)
    private readonly mgaRepo: Repository<MgaMaster>,
    @InjectRepository(MgaDocument)
    private readonly mgaDocRepo: Repository<MgaDocument>,
    @InjectRepository(ReinsurerCompany)
    private readonly reinsurerRepo: Repository<ReinsurerCompany>,
    @InjectRepository(RiskCompany)
    private readonly riskCompanyRepo: Repository<RiskCompany>,
    @InjectRepository(LineOfBusiness)
    private readonly lobRepo: Repository<LineOfBusiness>,
    @InjectRepository(CobMaster)
    private readonly cobRepo: Repository<CobMaster>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
    @InjectRepository(TreatyState)
    private readonly treatyStateRepo: Repository<TreatyState>,
    @InjectRepository(TreatyLob)
    private readonly treatyLobRepo: Repository<TreatyLob>,
    @InjectRepository(TreatyLobCob)
    private readonly treatyLobCobRepo: Repository<TreatyLobCob>,
    @InjectRepository(StateDocument)
    private readonly stateDocRepo: Repository<StateDocument>,
    @InjectRepository(RiskCompanyDocument)
    private readonly riskCompanyDocRepo: Repository<RiskCompanyDocument>,
    @InjectRepository(TreatyMga)
    private readonly treatyMgaRepo: Repository<TreatyMga>,
    private readonly dataSource: DataSource,
  ) {}

  // ==========================================
  // STATE MASTER OPERATIONS
  // ==========================================
  async findAllStates(search?: string, isActive?: boolean): Promise<StateMaster[]> {
    const where: any = [];
    if (search) {
      where.push({ name: Like(`%${search}%`), isActive });
      where.push({ stateAbbr: Like(`%${search}%`), isActive });
    } else {
      const obj: any = {};
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.stateRepo.find({ where: where.length > 1 ? where : where[0], order: { stateCode: { direction: 'ASC', nulls: 'LAST' } } });
  }

  async findOneState(id: string): Promise<StateMaster & { documents: StateDocument[] }> {
    const state = await this.stateRepo.findOne({ where: { id } });
    if (!state) throw new NotFoundException('State not found');
    const documents = await this.stateDocRepo.find({ where: { stateId: id }, order: { uploadedAt: 'DESC' } });
    return { ...state, documents };
  }

  async createState(dto: CreateStateDto, userId: string): Promise<StateMaster> {
    const exists = await this.stateRepo.findOne({ where: { stateAbbr: dto.state_abbr } });
    if (exists) {
      throw new BadRequestException(`State Abbr ${dto.state_abbr} already exists`);
    }
    if (dto.state_code) {
      const existsCode = await this.stateRepo.findOne({ where: { stateCode: dto.state_code } });
      if (existsCode) {
        throw new BadRequestException(`State Code ${dto.state_code} already exists`);
      }
    }
    const state = this.stateRepo.create({
      stateCode: dto.state_code ?? null,
      stateAbbr: dto.state_abbr,
      name: dto.name,
      notes: dto.notes ?? null,
      isActive: dto.is_active ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.stateRepo.save(state);
  }

  async updateState(id: string, dto: UpdateStateDto, userId: string): Promise<StateMaster> {
    const state = await this.stateRepo.findOne({ where: { id } });
    if (!state) throw new NotFoundException('State not found');

    if (dto.state_abbr !== undefined && dto.state_abbr !== state.stateAbbr) {
      const exists = await this.stateRepo.findOne({ where: { stateAbbr: dto.state_abbr } });
      if (exists) throw new BadRequestException(`State Abbr ${dto.state_abbr} already exists`);
    }
    if (dto.state_code !== undefined && dto.state_code !== state.stateCode && dto.state_code !== null) {
      const existsCode = await this.stateRepo.findOne({ where: { stateCode: dto.state_code } });
      if (existsCode) throw new BadRequestException(`State Code ${dto.state_code} already exists`);
    }

    Object.assign(state, {
      stateCode: dto.state_code !== undefined ? dto.state_code : state.stateCode,
      stateAbbr: dto.state_abbr !== undefined ? dto.state_abbr : state.stateAbbr,
      name: dto.name !== undefined ? dto.name : state.name,
      notes: dto.notes !== undefined ? dto.notes : state.notes,
      isActive: dto.is_active !== undefined ? dto.is_active : state.isActive,
      updatedBy: userId,
    });
    return this.stateRepo.save(state);
  }

  async deleteState(id: string): Promise<void> {
    const state = await this.stateRepo.findOne({ where: { id } });
    if (!state) throw new NotFoundException('State not found');
    await this.stateRepo.delete(id);
  }

  // ==========================================
  // MGA MASTER OPERATIONS
  // ==========================================
  async findAllMgas(search?: string, isActive?: boolean): Promise<MgaMaster[]> {
    const where: any = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return this.mgaRepo.find({ where, order: { mgaCode: 'ASC' } });
  }

  async findOneMga(id: string): Promise<MgaMaster & { documents: MgaDocument[] }> {
    const mga = await this.mgaRepo.findOne({ where: { id } });
    if (!mga) throw new NotFoundException('MGA not found');
    const documents = await this.mgaDocRepo.find({ where: { mgaId: id }, order: { uploadedAt: 'DESC' } });
    return { ...mga, documents };
  }

  async createMga(dto: CreateMgaDto, userId: string): Promise<MgaMaster> {
    const exists = await this.mgaRepo.findOne({ where: { mgaCode: dto.mga_code } });
    if (exists) throw new BadRequestException(`MGA code ${dto.mga_code} already exists`);

    const mga = this.mgaRepo.create({
      mgaCode: dto.mga_code,
      name: dto.name,
      taxPayableInhouse: dto.tax_payable_inhouse ?? false,
      isActive: dto.is_active ?? true,
      ledgerAmount: dto.ledger_amount ?? 0.00,
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
      createdBy: userId,
      updatedBy: userId,
    });
    return this.mgaRepo.save(mga);
  }

  async updateMga(id: string, dto: UpdateMgaDto, userId: string): Promise<MgaMaster> {
    const mga = await this.mgaRepo.findOne({ where: { id } });
    if (!mga) throw new NotFoundException('MGA not found');

    if (dto.mga_code !== undefined && dto.mga_code !== mga.mgaCode) {
      const exists = await this.mgaRepo.findOne({ where: { mgaCode: dto.mga_code } });
      if (exists) throw new BadRequestException(`MGA code ${dto.mga_code} already exists`);
    }

    Object.assign(mga, {
      mgaCode: dto.mga_code !== undefined ? dto.mga_code : mga.mgaCode,
      name: dto.name !== undefined ? dto.name : mga.name,
      taxPayableInhouse: dto.tax_payable_inhouse !== undefined ? dto.tax_payable_inhouse : mga.taxPayableInhouse,
      isActive: dto.is_active !== undefined ? dto.is_active : mga.isActive,
      ledgerAmount: dto.ledger_amount !== undefined ? dto.ledger_amount : mga.ledgerAmount,
      companyId: dto.company_id !== undefined ? (dto.company_id ? String(dto.company_id) : null) : mga.companyId,
      idName: dto.id_name !== undefined ? dto.id_name : mga.idName,
      address: dto.address !== undefined ? dto.address : mga.address,
      zip: dto.zip !== undefined ? dto.zip : mga.zip,
      city: dto.city !== undefined ? dto.city : mga.city,
      state: dto.state !== undefined ? dto.state : mga.state,
      phone: dto.phone !== undefined ? dto.phone : mga.phone,
      openItem: dto.open_item !== undefined ? dto.open_item : mga.openItem,
      opStartDate: dto.op_start_date !== undefined ? dto.op_start_date : mga.opStartDate,
      otherNames: dto.other_names !== undefined ? dto.other_names : mga.otherNames,
      updatedBy: userId,
    });
    return this.mgaRepo.save(mga);
  }

  async deleteMga(id: string): Promise<void> {
    const mga = await this.mgaRepo.findOne({ where: { id } });
    if (!mga) throw new NotFoundException('MGA not found');
    await this.mgaRepo.delete(id);
  }

  // ==========================================
  // REINSURER COMPANY OPERATIONS
  // ==========================================
  async findAllReinsurers(search?: string, isActive?: boolean): Promise<ReinsurerCompany[]> {
    const where: any = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return this.reinsurerRepo.find({ where, order: { reinsurerCompanyId: 'ASC' } });
  }

  async createReinsurer(dto: CreateReinsurerDto, userId: string): Promise<ReinsurerCompany> {
    const exists = await this.reinsurerRepo.findOne({ where: { reinsurerCompanyId: dto.reinsurer_company_id } });
    if (exists) throw new BadRequestException(`Reinsurer Company ID ${dto.reinsurer_company_id} already exists`);

    const rc = this.reinsurerRepo.create({
      reinsurerCompanyId: dto.reinsurer_company_id,
      name: dto.name,
      isActive: dto.is_active ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.reinsurerRepo.save(rc);
  }

  async updateReinsurer(id: string, dto: UpdateReinsurerDto, userId: string): Promise<ReinsurerCompany> {
    const rc = await this.reinsurerRepo.findOne({ where: { id } });
    if (!rc) throw new NotFoundException('Reinsurer not found');

    if (dto.reinsurer_company_id !== undefined && dto.reinsurer_company_id !== rc.reinsurerCompanyId) {
      const exists = await this.reinsurerRepo.findOne({ where: { reinsurerCompanyId: dto.reinsurer_company_id } });
      if (exists) throw new BadRequestException(`Reinsurer Company ID ${dto.reinsurer_company_id} already exists`);
    }

    Object.assign(rc, {
      reinsurerCompanyId: dto.reinsurer_company_id !== undefined ? dto.reinsurer_company_id : rc.reinsurerCompanyId,
      name: dto.name !== undefined ? dto.name : rc.name,
      isActive: dto.is_active !== undefined ? dto.is_active : rc.isActive,
      updatedBy: userId,
    });
    return this.reinsurerRepo.save(rc);
  }

  async deleteReinsurer(id: string): Promise<void> {
    const rc = await this.reinsurerRepo.findOne({ where: { id } });
    if (!rc) throw new NotFoundException('Reinsurer not found');
    await this.reinsurerRepo.delete(id);
  }

  // ==========================================
  // RISK COMPANY OPERATIONS
  // ==========================================
  async findAllRiskCompanies(search?: string, isActive?: boolean): Promise<RiskCompany[]> {
    const where: any = [];
    if (search) {
      where.push({ name: Like(`%${search}%`), isActive });
      where.push({ riskCompanyId: Like(`%${search}%`), isActive });
      where.push({ idName: Like(`%${search}%`), isActive });
    } else {
      const obj: any = {};
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.riskCompanyRepo.find({ where: where.length > 1 ? where : where[0], order: { riskCompanyId: 'ASC' } });
  }

  async findOneRiskCompany(id: string): Promise<RiskCompany & { documents: RiskCompanyDocument[] }> {
    const rc = await this.riskCompanyRepo.findOne({ where: { id } });
    if (!rc) throw new NotFoundException('Risk Company not found');
    const documents = await this.riskCompanyDocRepo.find({ where: { riskCompanyId: id }, order: { uploadedAt: 'DESC' } });
    return { ...rc, documents };
  }

  async createRiskCompany(dto: CreateRiskCompanyDto, userId: string): Promise<RiskCompany> {
    const exists = await this.riskCompanyRepo.findOne({ where: { riskCompanyId: dto.risk_company_id } });
    if (exists) throw new BadRequestException(`Risk Company ID ${dto.risk_company_id} already exists`);

    const rc = this.riskCompanyRepo.create({
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
    return this.riskCompanyRepo.save(rc);
  }

  async updateRiskCompany(id: string, dto: UpdateRiskCompanyDto, userId: string): Promise<RiskCompany> {
    const rc = await this.riskCompanyRepo.findOne({ where: { id } });
    if (!rc) throw new NotFoundException('Risk Company not found');

    if (dto.risk_company_id !== undefined && dto.risk_company_id !== rc.riskCompanyId) {
      const exists = await this.riskCompanyRepo.findOne({ where: { riskCompanyId: dto.risk_company_id } });
      if (exists) throw new BadRequestException(`Risk Company ID ${dto.risk_company_id} already exists`);
    }

    Object.assign(rc, {
      riskCompanyId: dto.risk_company_id !== undefined ? dto.risk_company_id : rc.riskCompanyId,
      companyId: dto.company_id !== undefined ? dto.company_id : rc.companyId,
      idName: dto.id_name !== undefined ? dto.id_name : rc.idName,
      name: dto.name !== undefined ? dto.name : rc.name,
      phone: dto.phone !== undefined ? dto.phone : rc.phone,
      isAdmitted: dto.is_admitted !== undefined ? dto.is_admitted : rc.isAdmitted,
      state: dto.state !== undefined ? dto.state : rc.state,
      address: dto.address !== undefined ? dto.address : rc.address,
      zip: dto.zip !== undefined ? dto.zip : rc.zip,
      city: dto.city !== undefined ? dto.city : rc.city,
      notes: dto.notes !== undefined ? dto.notes : rc.notes,
      isActive: dto.is_active !== undefined ? dto.is_active : rc.isActive,
      updatedBy: userId,
    });
    return this.riskCompanyRepo.save(rc);
  }

  async deleteRiskCompany(id: string): Promise<void> {
    const rc = await this.riskCompanyRepo.findOne({ where: { id } });
    if (!rc) throw new NotFoundException('Risk Company not found');
    await this.riskCompanyRepo.delete(id);
  }

  // ==========================================
  // LOB OPERATIONS
  // ==========================================
  async findAllLobs(search?: string, isActive?: boolean): Promise<LineOfBusiness[]> {
    const where: any = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return this.lobRepo.find({ where, order: { lobCode: 'ASC' } });
  }

  async createLob(dto: CreateLobDto, userId: string): Promise<LineOfBusiness> {
    const exists = await this.lobRepo.findOne({ where: { lobCode: dto.lob_code } });
    if (exists) throw new BadRequestException(`LOB code ${dto.lob_code} already exists`);

    const lob = this.lobRepo.create({
      lobCode: dto.lob_code,
      name: dto.name,
      isActive: dto.is_active ?? true,
      description: dto.description ?? null,
      type: dto.type ?? null,
      taxable: dto.taxable ?? false,
      priority: dto.priority ?? 1,
      fullyEarned: dto.fully_earned ?? false,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.lobRepo.save(lob);
  }

  async updateLob(id: string, dto: UpdateLobDto, userId: string): Promise<LineOfBusiness> {
    const lob = await this.lobRepo.findOne({ where: { id } });
    if (!lob) throw new NotFoundException('LOB not found');

    if (dto.lob_code !== undefined && dto.lob_code !== lob.lobCode) {
      const exists = await this.lobRepo.findOne({ where: { lobCode: dto.lob_code } });
      if (exists) throw new BadRequestException(`LOB code ${dto.lob_code} already exists`);
    }

    Object.assign(lob, {
      lobCode: dto.lob_code !== undefined ? dto.lob_code : lob.lobCode,
      name: dto.name !== undefined ? dto.name : lob.name,
      isActive: dto.is_active !== undefined ? dto.is_active : lob.isActive,
      description: dto.description !== undefined ? dto.description : lob.description,
      type: dto.type !== undefined ? dto.type : lob.type,
      taxable: dto.taxable !== undefined ? dto.taxable : lob.taxable,
      priority: dto.priority !== undefined ? dto.priority : lob.priority,
      fullyEarned: dto.fully_earned !== undefined ? dto.fully_earned : lob.fullyEarned,
      updatedBy: userId,
    });
    return this.lobRepo.save(lob);
  }

  async deleteLob(id: string): Promise<void> {
    const lob = await this.lobRepo.findOne({ where: { id } });
    if (!lob) throw new NotFoundException('LOB not found');
    await this.lobRepo.delete(id);
  }

  // ==========================================
  // COB OPERATIONS
  // ==========================================
  async findAllCobs(search?: string, isActive?: boolean): Promise<CobMaster[]> {
    const where: any = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return this.cobRepo.find({ where, order: { cobCode: 'ASC' } });
  }

  async createCob(dto: CreateCobDto, userId: string): Promise<CobMaster> {
    const exists = await this.cobRepo.findOne({ where: { cobCode: dto.cob_code } });
    if (exists) throw new BadRequestException(`COB code ${dto.cob_code} already exists`);

    const cob = this.cobRepo.create({
      cobCode: dto.cob_code,
      name: dto.name,
      isActive: dto.is_active ?? true,
      description: dto.description ?? null,
      type: dto.type ?? null,
      taxable: dto.taxable ?? false,
      priority: dto.priority ?? 1,
      fullyEarned: dto.fully_earned ?? false,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.cobRepo.save(cob);
  }

  async updateCob(id: string, dto: UpdateCobDto, userId: string): Promise<CobMaster> {
    const cob = await this.cobRepo.findOne({ where: { id } });
    if (!cob) throw new NotFoundException('COB not found');

    if (dto.cob_code !== undefined && dto.cob_code !== cob.cobCode) {
      const exists = await this.cobRepo.findOne({ where: { cobCode: dto.cob_code } });
      if (exists) throw new BadRequestException(`COB code ${dto.cob_code} already exists`);
    }

    Object.assign(cob, {
      cobCode: dto.cob_code !== undefined ? dto.cob_code : cob.cobCode,
      name: dto.name !== undefined ? dto.name : cob.name,
      isActive: dto.is_active !== undefined ? dto.is_active : cob.isActive,
      description: dto.description !== undefined ? dto.description : cob.description,
      type: dto.type !== undefined ? dto.type : cob.type,
      taxable: dto.taxable !== undefined ? dto.taxable : cob.taxable,
      priority: dto.priority !== undefined ? dto.priority : cob.priority,
      fullyEarned: dto.fully_earned !== undefined ? dto.fully_earned : cob.fullyEarned,
      updatedBy: userId,
    });
    return this.cobRepo.save(cob);
  }

  async deleteCob(id: string): Promise<void> {
    const cob = await this.cobRepo.findOne({ where: { id } });
    if (!cob) throw new NotFoundException('COB not found');
    await this.cobRepo.delete(id);
  }

  // ==========================================
  // TREATY MASTER OPERATIONS
  // ==========================================
  async findAllTreaties(search?: string, isActive?: boolean): Promise<Treaty[]> {
    const where: any = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return this.treatyRepo.find({
      where,
      relations: [
        'mga',
        'reinsurer',
        'riskCompany',
        'treatyLobs',
        'treatyLobs.lob',
        'treatyLobs.treatyLobCobs',
        'treatyLobs.treatyLobCobs.cob',
        'treatyStates',
        'treatyStates.state',
        'treatyMgas',
        'treatyMgas.mga',
        'treatyCarriers',
        'treatyCarriers.riskCompany',
        'treatyReinsurers',
        'treatyReinsurers.reinsurer',
      ],
      order: { treatyCode: 'ASC' },
    });
  }

  async findOneTreaty(id: string): Promise<Treaty> {
    const treaty = await this.treatyRepo.findOne({
      where: { id },
      relations: [
        'mga',
        'reinsurer',
        'riskCompany',
        'treatyLobs',
        'treatyLobs.lob',
        'treatyLobs.treatyLobCobs',
        'treatyLobs.treatyLobCobs.cob',
        'treatyStates',
        'treatyStates.state',
        'treatyMgas',
        'treatyMgas.mga',
        'treatyCarriers',
        'treatyCarriers.riskCompany',
        'treatyReinsurers',
        'treatyReinsurers.reinsurer',
      ],
    });
    if (!treaty) throw new NotFoundException('Treaty not found');
    return treaty;
  }

  async createTreaty(dto: CreateTreatyDto, userId: string): Promise<Treaty> {
    const exists = await this.treatyRepo.findOne({ where: { treatyCode: dto.treaty_code } });
    if (exists) throw new BadRequestException(`Treaty code ${dto.treaty_code} already exists`);

    if (!dto.carriers && dto.risk_company_id) {
      dto.carriers = [{ risk_company_id: dto.risk_company_id, retention_pct: dto.carrier_retention_pct ?? 100 }];
    }
    if (!dto.reinsurers && dto.reinsurer_id) {
      dto.reinsurers = [{ reinsurer_id: dto.reinsurer_id, cession_pct: dto.reinsurer_cession_pct ?? 100 }];
    }

    const firstCarrier = dto.carriers && dto.carriers.length > 0 ? dto.carriers[0] : null;
    const firstReinsurer = dto.reinsurers && dto.reinsurers.length > 0 ? dto.reinsurers[0] : null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const firstMgaId = dto.mga_ids && dto.mga_ids.length > 0 ? dto.mga_ids[0] : (dto.mga_id || null);
      const treaty = queryRunner.manager.create(Treaty, {
        treatyCode: dto.treaty_code,
        name: dto.name,
        mgaId: firstMgaId,
        reinsurerId: firstReinsurer ? firstReinsurer.reinsurer_id : (dto.reinsurer_id || null),
        riskCompanyId: firstCarrier ? firstCarrier.risk_company_id : (dto.risk_company_id || null),
        effectiveDate: dto.effective_date ? new Date(dto.effective_date) : null,
        expirationDate: dto.expiration_date ? new Date(dto.expiration_date) : null,
        qsPct: dto.qs_pct ?? null,
        cfPct: dto.cf_pct ?? null,
        commPct: dto.comm_pct ?? null,
        bbPct: dto.bb_pct ?? null,
        ulaePct: dto.ulae_pct ?? null,
        xolPct: dto.xol_pct ?? null,
        lrCapPct: dto.lr_cap_pct ?? null,
        ibnrPct: dto.ibnr_pct ?? null,
        laeDccPct: dto.lae_dcc_pct ?? null,
        laeAoePct: dto.lae_aoe_pct ?? null,
        carrierRetentionPct: firstCarrier ? firstCarrier.retention_pct : (dto.carrier_retention_pct ?? null),
        reinsurerCessionPct: firstReinsurer ? firstReinsurer.cession_pct : (dto.reinsurer_cession_pct ?? null),
        isActive: dto.is_active ?? true,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedTreaty = await queryRunner.manager.save(Treaty, treaty);

      if (dto.carriers && dto.carriers.length > 0) {
        const carriers = dto.carriers.map(c => {
          return queryRunner.manager.create(TreatyCarrier, {
            treatyId: savedTreaty.id,
            riskCompanyId: c.risk_company_id,
            retentionPct: c.retention_pct,
          });
        });
        await queryRunner.manager.save(TreatyCarrier, carriers);
      }

      if (dto.reinsurers && dto.reinsurers.length > 0) {
        const reinsurers = dto.reinsurers.map(r => {
          return queryRunner.manager.create(TreatyReinsurer, {
            treatyId: savedTreaty.id,
            reinsurerId: r.reinsurer_id,
            cessionPct: r.cession_pct,
          });
        });
        await queryRunner.manager.save(TreatyReinsurer, reinsurers);
      }

      if (dto.mga_ids && dto.mga_ids.length > 0) {
        const treatyMgas = dto.mga_ids.map(mgaId => {
          return queryRunner.manager.create(TreatyMga, {
            treatyId: savedTreaty.id,
            mgaId,
          });
        });
        await queryRunner.manager.save(TreatyMga, treatyMgas);
      }

      if (dto.state_ids && dto.state_ids.length > 0) {
        const treatyStates = dto.state_ids.map(stateId => {
          return queryRunner.manager.create(TreatyState, {
            treatyId: savedTreaty.id,
            stateId,
          });
        });
        await queryRunner.manager.save(TreatyState, treatyStates);
      }

      if (dto.lobs && dto.lobs.length > 0) {
        for (const lobDto of dto.lobs) {
          const treatyLob = queryRunner.manager.create(TreatyLob, {
            treatyId: savedTreaty.id,
            lobId: lobDto.lob_id,
          });
          const savedTreatyLob = await queryRunner.manager.save(TreatyLob, treatyLob);

          if (lobDto.cob_ids && lobDto.cob_ids.length > 0) {
            const treatyLobCobs = lobDto.cob_ids.map(cobId => {
              return queryRunner.manager.create(TreatyLobCob, {
                treatyLobId: savedTreatyLob.id,
                cobId,
              });
            });
            await queryRunner.manager.save(TreatyLobCob, treatyLobCobs);
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.findOneTreaty(savedTreaty.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateTreaty(id: string, dto: UpdateTreatyDto, userId: string): Promise<Treaty> {
    const treaty = await this.treatyRepo.findOne({ where: { id } });
    if (!treaty) throw new NotFoundException('Treaty not found');

    if (dto.treaty_code !== undefined && dto.treaty_code !== treaty.treatyCode) {
      const exists = await this.treatyRepo.findOne({ where: { treatyCode: dto.treaty_code } });
      if (exists) throw new BadRequestException(`Treaty code ${dto.treaty_code} already exists`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let updateMgaId = treaty.mgaId;
      if (dto.mga_ids !== undefined) {
        updateMgaId = dto.mga_ids.length > 0 ? dto.mga_ids[0] : null;
      } else if (dto.mga_id !== undefined) {
        updateMgaId = dto.mga_id;
      }

      let updateRiskCompanyId = treaty.riskCompanyId;
      let updateCarrierRetention = treaty.carrierRetentionPct;
      if (dto.carriers !== undefined) {
        if (dto.carriers.length > 0) {
          updateRiskCompanyId = dto.carriers[0].risk_company_id;
          updateCarrierRetention = dto.carriers[0].retention_pct;
        } else {
          updateRiskCompanyId = null;
          updateCarrierRetention = null;
        }
      } else if (dto.risk_company_id !== undefined) {
        updateRiskCompanyId = dto.risk_company_id;
        updateCarrierRetention = dto.carrier_retention_pct !== undefined ? dto.carrier_retention_pct : treaty.carrierRetentionPct;
      }

      let updateReinsurerId = treaty.reinsurerId;
      let updateReinsurerCession = treaty.reinsurerCessionPct;
      if (dto.reinsurers !== undefined) {
        if (dto.reinsurers.length > 0) {
          updateReinsurerId = dto.reinsurers[0].reinsurer_id;
          updateReinsurerCession = dto.reinsurers[0].cession_pct;
        } else {
          updateReinsurerId = null;
          updateReinsurerCession = null;
        }
      } else if (dto.reinsurer_id !== undefined) {
        updateReinsurerId = dto.reinsurer_id;
        updateReinsurerCession = dto.reinsurer_cession_pct !== undefined ? dto.reinsurer_cession_pct : treaty.reinsurerCessionPct;
      }

      Object.assign(treaty, {
        treatyCode: dto.treaty_code !== undefined ? dto.treaty_code : treaty.treatyCode,
        name: dto.name !== undefined ? dto.name : treaty.name,
        mgaId: updateMgaId,
        reinsurerId: updateReinsurerId,
        riskCompanyId: updateRiskCompanyId,
        effectiveDate: dto.effective_date !== undefined ? (dto.effective_date ? new Date(dto.effective_date) : null) : treaty.effectiveDate,
        expirationDate: dto.expiration_date !== undefined ? (dto.expiration_date ? new Date(dto.expiration_date) : null) : treaty.expirationDate,
        qsPct: dto.qs_pct !== undefined ? dto.qs_pct : treaty.qsPct,
        cfPct: dto.cf_pct !== undefined ? dto.cf_pct : treaty.cfPct,
        commPct: dto.comm_pct !== undefined ? dto.comm_pct : treaty.commPct,
        bbPct: dto.bb_pct !== undefined ? dto.bb_pct : treaty.bbPct,
        ulaePct: dto.ulae_pct !== undefined ? dto.ulae_pct : treaty.ulaePct,
        xolPct: dto.xol_pct !== undefined ? dto.xol_pct : treaty.xolPct,
        lrCapPct: dto.lr_cap_pct !== undefined ? dto.lr_cap_pct : treaty.lrCapPct,
        ibnrPct: dto.ibnr_pct !== undefined ? dto.ibnr_pct : treaty.ibnrPct,
        laeDccPct: dto.lae_dcc_pct !== undefined ? dto.lae_dcc_pct : treaty.laeDccPct,
        laeAoePct: dto.lae_aoe_pct !== undefined ? dto.lae_aoe_pct : treaty.laeAoePct,
        carrierRetentionPct: updateCarrierRetention,
        reinsurerCessionPct: updateReinsurerCession,
        isActive: dto.is_active !== undefined ? dto.is_active : treaty.isActive,
        updatedBy: userId,
      });

      await queryRunner.manager.save(Treaty, treaty);

      if (dto.carriers !== undefined) {
        await queryRunner.manager.delete(TreatyCarrier, { treatyId: id });
        if (dto.carriers.length > 0) {
          const carriers = dto.carriers.map(c => {
            return queryRunner.manager.create(TreatyCarrier, {
              treatyId: id,
              riskCompanyId: c.risk_company_id,
              retentionPct: c.retention_pct,
            });
          });
          await queryRunner.manager.save(TreatyCarrier, carriers);
        }
      }

      if (dto.reinsurers !== undefined) {
        await queryRunner.manager.delete(TreatyReinsurer, { treatyId: id });
        if (dto.reinsurers.length > 0) {
          const reinsurers = dto.reinsurers.map(r => {
            return queryRunner.manager.create(TreatyReinsurer, {
              treatyId: id,
              reinsurerId: r.reinsurer_id,
              cessionPct: r.cession_pct,
            });
          });
          await queryRunner.manager.save(TreatyReinsurer, reinsurers);
        }
      }

      if (dto.mga_ids !== undefined) {
        await queryRunner.manager.delete(TreatyMga, { treatyId: id });
        if (dto.mga_ids.length > 0) {
          const treatyMgas = dto.mga_ids.map(mgaId => {
            return queryRunner.manager.create(TreatyMga, {
              treatyId: id,
              mgaId,
            });
          });
          await queryRunner.manager.save(TreatyMga, treatyMgas);
        }
      }

      if (dto.state_ids !== undefined) {
        await queryRunner.manager.delete(TreatyState, { treatyId: id });
        if (dto.state_ids.length > 0) {
          const treatyStates = dto.state_ids.map(stateId => {
            return queryRunner.manager.create(TreatyState, {
              treatyId: id,
              stateId,
            });
          });
          await queryRunner.manager.save(TreatyState, treatyStates);
        }
      }

      if (dto.lobs !== undefined) {
        // Cascade delete will delete treaty_lob_cobs
        await queryRunner.manager.delete(TreatyLob, { treatyId: id });
        if (dto.lobs.length > 0) {
          for (const lobDto of dto.lobs) {
            const treatyLob = queryRunner.manager.create(TreatyLob, {
              treatyId: id,
              lobId: lobDto.lob_id,
            });
            const savedTreatyLob = await queryRunner.manager.save(TreatyLob, treatyLob);

            if (lobDto.cob_ids && lobDto.cob_ids.length > 0) {
              const treatyLobCobs = lobDto.cob_ids.map(cobId => {
                return queryRunner.manager.create(TreatyLobCob, {
                  treatyLobId: savedTreatyLob.id,
                  cobId,
                });
              });
              await queryRunner.manager.save(TreatyLobCob, treatyLobCobs);
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.findOneTreaty(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTreaty(id: string): Promise<void> {
    const treaty = await this.treatyRepo.findOne({ where: { id } });
    if (!treaty) throw new NotFoundException('Treaty not found');
    await this.treatyRepo.delete(id);
  }

  // ==========================================
  // MGA DOCUMENT ATTACHMENTS
  // ==========================================
  async addMgaDocument(
    mgaId: string,
    fileName: string,
    fileUrl: string,
    userId: string,
  ): Promise<MgaDocument> {
    const mga = await this.mgaRepo.findOne({ where: { id: mgaId } });
    if (!mga) throw new NotFoundException('MGA not found');

    const doc = this.mgaDocRepo.create({
      mgaId,
      fileName,
      fileUrl,
      uploadedBy: userId,
    });
    return this.mgaDocRepo.save(doc);
  }

  async findMgaDocument(id: string): Promise<MgaDocument> {
    const doc = await this.mgaDocRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async deleteMgaDocument(id: string): Promise<void> {
    const doc = await this.mgaDocRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.mgaDocRepo.delete(id);
  }

  // ==========================================
  // STATE DOCUMENT ATTACHMENTS
  // ==========================================
  async addStateDocument(
    stateId: string,
    fileName: string,
    fileUrl: string,
    userId: string,
  ): Promise<StateDocument> {
    const state = await this.stateRepo.findOne({ where: { id: stateId } });
    if (!state) throw new NotFoundException('State not found');

    const doc = this.stateDocRepo.create({
      stateId,
      fileName,
      fileUrl,
      uploadedBy: userId,
    });
    return this.stateDocRepo.save(doc);
  }

  async findStateDocument(id: string): Promise<StateDocument> {
    const doc = await this.stateDocRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async deleteStateDocument(id: string): Promise<void> {
    const doc = await this.stateDocRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.stateDocRepo.delete(id);
  }

  // ==========================================
  // RISK COMPANY DOCUMENT ATTACHMENTS
  // ==========================================
  async addRiskCompanyDocument(
    riskCompanyId: string,
    fileName: string,
    fileUrl: string,
    userId: string,
  ): Promise<RiskCompanyDocument> {
    const rc = await this.riskCompanyRepo.findOne({ where: { id: riskCompanyId } });
    if (!rc) throw new NotFoundException('Risk Company not found');

    const doc = this.riskCompanyDocRepo.create({
      riskCompanyId,
      fileName,
      fileUrl,
      uploadedBy: userId,
    });
    return this.riskCompanyDocRepo.save(doc);
  }

  async findRiskCompanyDocument(id: string): Promise<RiskCompanyDocument> {
    const doc = await this.riskCompanyDocRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async deleteRiskCompanyDocument(id: string): Promise<void> {
    const doc = await this.riskCompanyDocRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.riskCompanyDocRepo.delete(id);
  }

  async addMgaToTreaties(mgaId: string, treatyIds: string[], userId: string): Promise<{ success: boolean }> {
    const mga = await this.mgaRepo.findOne({ where: { id: mgaId } });
    if (!mga) throw new NotFoundException('MGA not found');

    for (const treatyId of treatyIds) {
      const treaty = await this.treatyRepo.findOne({ where: { id: treatyId } });
      if (!treaty) continue;

      const exists = await this.treatyMgaRepo.findOne({ where: { treatyId, mgaId } });
      if (!exists) {
        const link = this.treatyMgaRepo.create({ treatyId, mgaId });
        await this.treatyMgaRepo.save(link);
      }

      if (!treaty.mgaId) {
        treaty.mgaId = mgaId;
        treaty.updatedBy = userId;
        await this.treatyRepo.save(treaty);
      }
    }

    return { success: true };
  }
}
