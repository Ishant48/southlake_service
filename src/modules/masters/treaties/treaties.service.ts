import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TreatiesDao } from './dao/treaties.dao';
import { Treaty } from '../entities/treaty.entity';
import { TreatyState } from '../entities/treaty-state.entity';
import { TreatyMga } from '../entities/treaty-mga.entity';
import { TreatyCarrier } from '../entities/treaty-carrier.entity';
import { TreatyReinsurer } from '../entities/treaty-reinsurer.entity';
import { TreatyProduct } from '../entities/treaty-product.entity';
import { CreateTreatyDto, UpdateTreatyDto } from '../dto/treaty.dto';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';

/** CRUD for treaty master records, including their carriers, reinsurers, MGAs, states, LOBs and COBs. */
@Injectable()
export class TreatiesService {
  constructor(
    private readonly dao: TreatiesDao,
    private readonly dataSource: DataSource,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAllTreaties(search?: string): Promise<Treaty[]> {
    return this.dao.findAll(search);
  }

  async findOneTreaty(id: string): Promise<Treaty> {
    const treaty = await this.dao.findByIdWithDetails(id);
    if (!treaty) throw new NotFoundException('Treaty not found');
    return treaty;
  }

  async createTreaty(dto: CreateTreatyDto, userId: string): Promise<Treaty> {
    const exists = await this.dao.findByCode(dto.treaty_code);
    if (exists) throw new BadRequestException(`Treaty code ${dto.treaty_code} already exists`);

    const firstCarrier = dto.carriers && dto.carriers.length > 0 ? dto.carriers[0] : null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const firstMgaId =
        dto.mga_ids && dto.mga_ids.length > 0 ? dto.mga_ids[0] : (dto.mga_id ?? null);
      const treaty = queryRunner.manager.create(Treaty, {
        treatyCode: dto.treaty_code,
        name: dto.name,
        mgaId: firstMgaId,
        riskCompanyId: firstCarrier ? firstCarrier.carrier_id : (dto.risk_company_id ?? null),
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
        treatyTypeId: dto.treaty_type_id,
        carrierAllocationType: dto.carrier_allocation_type ?? null,
        ulaeType: dto.ulae_type ?? 'percentage',
        ulaeBasis: dto.ulae_basis ?? null,
        ulaeFlatAmount: dto.ulae_flat_amount ?? null,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedTreaty = await queryRunner.manager.save(Treaty, treaty);

      if (dto.carriers && dto.carriers.length > 0) {
        const carriers = dto.carriers.map(c => {
          return queryRunner.manager.create(TreatyCarrier, {
            treatyId: savedTreaty.id,
            carrierId: c.carrier_id,
            pct: c.pct,
            stateId: c.state_id,
          });
        });
        await queryRunner.manager.save(TreatyCarrier, carriers);
      }

      if (dto.reinsurers && dto.reinsurers.length > 0) {
        const reinsurers = dto.reinsurers.map(r => {
          return queryRunner.manager.create(TreatyReinsurer, {
            treatyId: savedTreaty.id,
            reinsurerId: r.reinsurer_id,
            quotaShare: r.quota_share,
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

      if (dto.products && dto.products.length > 0) {
        const products = dto.products.map(p =>
          queryRunner.manager.create(TreatyProduct, {
            treatyId: savedTreaty.id,
            productId: p.product_id,
          }),
        );
        await queryRunner.manager.save(TreatyProduct, products);
      }

      await queryRunner.commitTransaction();
      await this.activityLogsService.log({
        userId,
        moduleId: 'master_data',
        action: 'create',
        description: `Created Treaty ${savedTreaty.name} (${savedTreaty.treatyCode})`,
      });
      return this.findOneTreaty(savedTreaty.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateTreaty(id: string, dto: UpdateTreatyDto, userId: string): Promise<Treaty> {
    const treaty = await this.dao.findById(id);
    if (!treaty) throw new NotFoundException('Treaty not found');

    if (dto.treaty_code !== undefined && dto.treaty_code !== treaty.treatyCode) {
      const exists = await this.dao.findByCode(dto.treaty_code);
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
      if (dto.carriers !== undefined) {
        if (dto.carriers.length > 0) {
          updateRiskCompanyId = dto.carriers[0].carrier_id;
        } else {
          updateRiskCompanyId = null;
        }
      } else if (dto.risk_company_id !== undefined) {
        updateRiskCompanyId = dto.risk_company_id;
      }

      Object.assign(treaty, {
        treatyCode: dto.treaty_code ?? treaty.treatyCode,
        name: dto.name ?? treaty.name,
        mgaId: updateMgaId,
        riskCompanyId: updateRiskCompanyId,
        effectiveDate:
          dto.effective_date !== undefined
            ? dto.effective_date
              ? new Date(dto.effective_date)
              : null
            : treaty.effectiveDate,
        expirationDate:
          dto.expiration_date !== undefined
            ? dto.expiration_date
              ? new Date(dto.expiration_date)
              : null
            : treaty.expirationDate,
        qsPct: dto.qs_pct ?? treaty.qsPct,
        cfPct: dto.cf_pct ?? treaty.cfPct,
        commPct: dto.comm_pct ?? treaty.commPct,
        bbPct: dto.bb_pct ?? treaty.bbPct,
        ulaePct: dto.ulae_pct ?? treaty.ulaePct,
        xolPct: dto.xol_pct ?? treaty.xolPct,
        lrCapPct: dto.lr_cap_pct ?? treaty.lrCapPct,
        ibnrPct: dto.ibnr_pct ?? treaty.ibnrPct,
        laeDccPct: dto.lae_dcc_pct ?? treaty.laeDccPct,
        laeAoePct: dto.lae_aoe_pct ?? treaty.laeAoePct,
        treatyTypeId: dto.treaty_type_id ?? treaty.treatyTypeId,
        carrierAllocationType: dto.carrier_allocation_type ?? treaty.carrierAllocationType,
        ulaeType: dto.ulae_type ?? treaty.ulaeType,
        ulaeBasis: dto.ulae_basis ?? treaty.ulaeBasis,
        ulaeFlatAmount: dto.ulae_flat_amount ?? treaty.ulaeFlatAmount,
        updatedBy: userId,
      });

      await queryRunner.manager.save(Treaty, treaty);

      if (dto.carriers !== undefined) {
        await queryRunner.manager.delete(TreatyCarrier, { treatyId: id });
        if (dto.carriers.length > 0) {
          const carriers = dto.carriers.map(c => {
            return queryRunner.manager.create(TreatyCarrier, {
              treatyId: id,
              carrierId: c.carrier_id,
              pct: c.pct,
              stateId: c.state_id,
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
              quotaShare: r.quota_share,
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

      if (dto.products !== undefined) {
        await queryRunner.manager.delete(TreatyProduct, { treatyId: id });
        if (dto.products.length > 0) {
          const products = dto.products.map(p =>
            queryRunner.manager.create(TreatyProduct, {
              treatyId: id,
              productId: p.product_id,
            }),
          );
          await queryRunner.manager.save(TreatyProduct, products);
        }
      }

      await queryRunner.commitTransaction();
      await this.activityLogsService.log({
        userId,
        moduleId: 'master_data',
        action: 'edit',
        description: `Updated Treaty ${treaty.name} (${treaty.treatyCode})`,
      });
      return this.findOneTreaty(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTreaty(id: string, userId?: string): Promise<void> {
    const treaty = await this.dao.findById(id);
    if (!treaty) throw new NotFoundException('Treaty not found');
    await this.dao.delete(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'delete',
      description: `Deleted Treaty ${treaty.name} (${treaty.treatyCode})`,
    });
  }
}
