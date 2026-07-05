import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReinsurersDao } from './dao/reinsurers.dao';
import { ReinsurerCompany } from '../entities/reinsurer-company.entity';
import { CreateReinsurerDto, UpdateReinsurerDto } from '../dto/reinsurer.dto';

/** CRUD for reinsurer company master records. */
@Injectable()
export class ReinsurersService {
  constructor(private readonly dao: ReinsurersDao) {}

  async findAllReinsurers(search?: string, isActive?: boolean): Promise<ReinsurerCompany[]> {
    return this.dao.findAll(search, isActive);
  }

  async createReinsurer(dto: CreateReinsurerDto, userId: string): Promise<ReinsurerCompany> {
    const exists = await this.dao.findByCompanyId(dto.reinsurer_company_id);
    if (exists)
      throw new BadRequestException(
        `Reinsurer Company ID ${dto.reinsurer_company_id} already exists`,
      );

    const rc = this.dao.create({
      reinsurerCompanyId: dto.reinsurer_company_id,
      name: dto.name,
      isActive: dto.is_active ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.dao.save(rc);
  }

  async updateReinsurer(
    id: string,
    dto: UpdateReinsurerDto,
    userId: string,
  ): Promise<ReinsurerCompany> {
    const rc = await this.dao.findById(id);
    if (!rc) throw new NotFoundException('Reinsurer not found');

    if (
      dto.reinsurer_company_id !== undefined &&
      dto.reinsurer_company_id !== rc.reinsurerCompanyId
    ) {
      const exists = await this.dao.findByCompanyId(dto.reinsurer_company_id);
      if (exists)
        throw new BadRequestException(
          `Reinsurer Company ID ${dto.reinsurer_company_id} already exists`,
        );
    }

    Object.assign(rc, {
      reinsurerCompanyId: dto.reinsurer_company_id ?? rc.reinsurerCompanyId,
      name: dto.name ?? rc.name,
      isActive: dto.is_active ?? rc.isActive,
      updatedBy: userId,
    });
    return this.dao.save(rc);
  }

  async deleteReinsurer(id: string): Promise<void> {
    const rc = await this.dao.findById(id);
    if (!rc) throw new NotFoundException('Reinsurer not found');
    await this.dao.delete(id);
  }
}
