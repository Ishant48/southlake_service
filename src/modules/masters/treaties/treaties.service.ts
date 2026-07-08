import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { TreatiesDao } from './dao/treaties.dao';
import { Treaty } from '../entities/treaty.entity';
import { TreatyLob } from '../entities/treaty-lob.entity';
import { TreatyLobCob } from '../entities/treaty-lob-cob.entity';
import { TreatyState } from '../entities/treaty-state.entity';
import { TreatyMga } from '../entities/treaty-mga.entity';
import { TreatyCarrier } from '../entities/treaty-carrier.entity';
import { TreatyReinsurer } from '../entities/treaty-reinsurer.entity';
import { ReinsurerCompany } from '../entities/reinsurer-company.entity';
import { RiskCompany } from '../entities/risk-company.entity';
import { CreateTreatyDto, UpdateTreatyDto } from '../dto/treaty.dto';

/** CRUD for treaty master records, including their carriers, reinsurers, MGAs, states, LOBs and COBs. */
@Injectable()
export class TreatiesService {
  constructor(
    private readonly dao: TreatiesDao,
    private readonly dataSource: DataSource,
  ) {}

  async findAllTreaties(search?: string, isActive?: boolean): Promise<Treaty[]> {
    return this.dao.findAll(search, isActive);
  }

  async findOneTreaty(id: string): Promise<Treaty> {
    const treaty = await this.dao.findByIdWithDetails(id);
    if (!treaty) throw new NotFoundException('Treaty not found');
    return treaty;
  }

  async createTreaty(dto: CreateTreatyDto, userId: string): Promise<Treaty> {
    const exists = await this.dao.findByCode(dto.treaty_code);
    if (exists) throw new BadRequestException(`Treaty code ${dto.treaty_code} already exists`);

    if (!dto.carriers && dto.risk_company_id) {
      dto.carriers = [
        { risk_company_id: dto.risk_company_id, retention_pct: dto.carrier_retention_pct ?? 100 },
      ];
    }
    if (!dto.reinsurers && dto.reinsurer_id) {
      dto.reinsurers = [
        { reinsurer_id: dto.reinsurer_id, cession_pct: dto.reinsurer_cession_pct ?? 100 },
      ];
    }

    const firstCarrier = dto.carriers && dto.carriers.length > 0 ? dto.carriers[0] : null;
    const firstReinsurer = dto.reinsurers && dto.reinsurers.length > 0 ? dto.reinsurers[0] : null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const firstMgaId =
        dto.mga_ids && dto.mga_ids.length > 0 ? dto.mga_ids[0] : (dto.mga_id ?? null);

      const firstReinsurerId = firstReinsurer ? firstReinsurer.reinsurer_id : (dto.reinsurer_id ?? null);
      if (firstReinsurerId) {
        await this.ensureReinsurerExists(queryRunner, firstReinsurerId, userId);
      }
      if (dto.reinsurers && dto.reinsurers.length > 0) {
        for (const r of dto.reinsurers) {
          await this.ensureReinsurerExists(queryRunner, r.reinsurer_id, userId);
        }
      }

      const treaty = queryRunner.manager.create(Treaty, {
        treatyCode: dto.treaty_code,
        name: dto.name,
        mgaId: firstMgaId,
        reinsurerId: firstReinsurerId,
        riskCompanyId: firstCarrier ? firstCarrier.risk_company_id : (dto.risk_company_id ?? null),
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
        carrierRetentionPct: firstCarrier
          ? firstCarrier.retention_pct
          : (dto.carrier_retention_pct ?? null),
        reinsurerCessionPct: firstReinsurer
          ? firstReinsurer.cession_pct
          : (dto.reinsurer_cession_pct ?? null),
        treatyType: dto.treaty_type ?? 'Quota Share',
        ulaeType: dto.ulae_type ?? 'percentage',
        ulaeBasis: dto.ulae_basis ?? null,
        ulaeFlatAmount: dto.ulae_flat_amount ?? null,
        policySeqPrefix: dto.policy_seq_prefix ?? null,
        policySeqStart: dto.policy_seq_start ?? null,
        policySeqNext: dto.policy_seq_next ?? dto.policy_seq_start ?? null,
        claimSeqPrefix: dto.claim_seq_prefix ?? null,
        claimSeqStart: dto.claim_seq_start ?? null,
        claimSeqNext: dto.claim_seq_next ?? dto.claim_seq_start ?? null,
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
            stateId: c.state_id ?? null,
            brokerId: c.broker_id ?? null,
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
            stateId: r.state_ids && r.state_ids.length > 0 ? r.state_ids[0] : (r.state_id ?? null),
            stateIds: r.state_ids ?? null,
            brokerId: r.broker_id ?? null,
            brokerCommType: r.broker_comm_type ?? null,
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
        updateCarrierRetention = dto.carrier_retention_pct ?? treaty.carrierRetentionPct;
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
        updateReinsurerCession = dto.reinsurer_cession_pct ?? treaty.reinsurerCessionPct;
      }

      if (updateReinsurerId) {
        await this.ensureReinsurerExists(queryRunner, updateReinsurerId, userId);
      }
      if (dto.reinsurers) {
        for (const r of dto.reinsurers) {
          await this.ensureReinsurerExists(queryRunner, r.reinsurer_id, userId);
        }
      }

      Object.assign(treaty, {
        treatyCode: dto.treaty_code ?? treaty.treatyCode,
        name: dto.name ?? treaty.name,
        mgaId: updateMgaId,
        reinsurerId: updateReinsurerId,
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
        carrierRetentionPct: updateCarrierRetention,
        reinsurerCessionPct: updateReinsurerCession,
        treatyType: dto.treaty_type ?? treaty.treatyType,
        ulaeType: dto.ulae_type ?? treaty.ulaeType,
        ulaeBasis: dto.ulae_basis ?? treaty.ulaeBasis,
        ulaeFlatAmount: dto.ulae_flat_amount ?? treaty.ulaeFlatAmount,
        policySeqPrefix: dto.policy_seq_prefix ?? treaty.policySeqPrefix,
        policySeqStart: dto.policy_seq_start ?? treaty.policySeqStart,
        policySeqNext: dto.policy_seq_next ?? treaty.policySeqNext,
        claimSeqPrefix: dto.claim_seq_prefix ?? treaty.claimSeqPrefix,
        claimSeqStart: dto.claim_seq_start ?? treaty.claimSeqStart,
        claimSeqNext: dto.claim_seq_next ?? treaty.claimSeqNext,
        isActive: dto.is_active ?? treaty.isActive,
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
              stateId: c.state_id ?? null,
              brokerId: c.broker_id ?? null,
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
              stateId: r.state_ids && r.state_ids.length > 0 ? r.state_ids[0] : (r.state_id ?? null),
              stateIds: r.state_ids ?? null,
              brokerId: r.broker_id ?? null,
              brokerCommType: r.broker_comm_type ?? null,
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

  private async ensureReinsurerExists(queryRunner: QueryRunner, id: string, userId: string): Promise<void> {
    const exists = await queryRunner.manager.findOne(ReinsurerCompany, { where: { id } });
    if (exists) return;

    const riskCo = await queryRunner.manager.findOne(RiskCompany, { where: { id } });
    if (riskCo) {
      const newReinsurer = queryRunner.manager.create(ReinsurerCompany, {
        id: riskCo.id,
        reinsurerCompanyId: riskCo.riskCompanyId || 'RC-' + riskCo.id.slice(0, 5),
        name: riskCo.name,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      });
      await queryRunner.manager.save(ReinsurerCompany, newReinsurer);
    }
  }

  async deleteTreaty(id: string): Promise<void> {
    const treaty = await this.dao.findById(id);
    if (!treaty) throw new NotFoundException('Treaty not found');
    await this.dao.delete(id);
  }
}
