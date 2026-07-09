import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { ProductsDao } from './dao/products.dao';
import { Product } from '../entities/product.entity';
import { ProductReinsurer } from '../entities/product-reinsurer.entity';
import { LineOfBusiness } from '../entities/line-of-business.entity';
import { CobMaster } from '../entities/cob-master.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

export interface ProductWithRelations extends Product {
  lobs: LineOfBusiness[];
  cobs: CobMaster[];
  lob: LineOfBusiness | null;
  cob: CobMaster | null;
}

export interface GetOrCreateProductForCarrierParams {
  riskCompanyId: string;
  mgaId: string | null;
  reinsurerIds: string[];
  lobIds: string[];
  cobIds: string[];
  carrierName: string;
  mgaName: string | null;
}

function toCommaString(val: string | string[] | undefined | null): string | null {
  if (!val) return null;
  if (Array.isArray(val)) {
    return val
      .filter(Boolean)
      .map(v => String(v).trim())
      .join(',');
  }
  return String(val).trim();
}

function arraysEqualAsSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

/** CRUD for product master records. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly dao: ProductsDao,
    private readonly activityLogsService: ActivityLogsService,
    @InjectRepository(ProductReinsurer)
    private readonly productReinsurerRepo: Repository<ProductReinsurer>,
  ) {}

  async findAllProducts(search?: string, isActive?: boolean): Promise<ProductWithRelations[]> {
    const products = await this.dao.findAll(search, isActive);
    const lobs = await this.dao.findAllLobs();
    const cobs = await this.dao.findAllCobs();

    const lobMap = new Map(lobs.map(l => [l.id, l]));
    const cobMap = new Map(cobs.map(c => [c.id, c]));

    return products.map(product => {
      const lobIds = product.lobId ? product.lobId.split(',') : [];
      const cobIds = product.cobId ? product.cobId.split(',') : [];

      const productLobs = lobIds.map(id => lobMap.get(id)).filter((l): l is LineOfBusiness => !!l);
      const productCobs = cobIds.map(id => cobMap.get(id)).filter((c): c is CobMaster => !!c);

      return {
        ...product,
        lobs: productLobs,
        cobs: productCobs,
        lob: productLobs[0] ?? null,
        cob: productCobs[0] ?? null,
      };
    });
  }

  async findOneProduct(id: string): Promise<ProductWithRelations> {
    const product = await this.dao.findById(id);
    if (!product) throw new NotFoundException('Product not found');

    const lobs = await this.dao.findAllLobs();
    const cobs = await this.dao.findAllCobs();

    const lobMap = new Map(lobs.map(l => [l.id, l]));
    const cobMap = new Map(cobs.map(c => [c.id, c]));

    const lobIds = product.lobId ? product.lobId.split(',') : [];
    const cobIds = product.cobId ? product.cobId.split(',') : [];

    const productLobs = lobIds.map(id => lobMap.get(id)).filter((l): l is LineOfBusiness => !!l);
    const productCobs = cobIds.map(id => cobMap.get(id)).filter((c): c is CobMaster => !!c);

    return {
      ...product,
      lobs: productLobs,
      cobs: productCobs,
      lob: productLobs[0] ?? null,
      cob: productCobs[0] ?? null,
    };
  }

  private async generateProductId(manager?: EntityManager): Promise<string> {
    const em = manager ?? this.productReinsurerRepo.manager;
    const result: Array<{ val: string | number }> = await em.query(
      `SELECT nextval('product_master_product_id_seq') as val`,
    );
    const val = result[0].val;
    return `PRD-${String(val).padStart(5, '0')}`;
  }

  async findMatchingProduct(
    params: {
      riskCompanyId: string;
      mgaId: string | null;
      reinsurerIds: string[];
      lobIds: string[];
      cobIds: string[];
    },
    manager?: EntityManager,
  ): Promise<Product | null> {
    const em = manager ?? this.productReinsurerRepo.manager;
    const productRepo = em.getRepository(Product);
    const reinsurerRepo = em.getRepository(ProductReinsurer);

    const candidates = await productRepo.find({
      where: {
        riskCompanyId: params.riskCompanyId,
        mgaId: params.mgaId ?? IsNull(),
        isDeleted: false,
      },
    });

    for (const candidate of candidates) {
      const productReinsurers = await reinsurerRepo.find({
        where: { productId: candidate.id, isDeleted: false },
      });
      const candidateReinsurerIds = productReinsurers.map(pr => pr.reinsurerId);
      if (!arraysEqualAsSets(candidateReinsurerIds, params.reinsurerIds)) continue;

      const candidateLobIds = candidate.lobId ? candidate.lobId.split(',').filter(Boolean) : [];
      const candidateCobIds = candidate.cobId ? candidate.cobId.split(',').filter(Boolean) : [];
      if (!arraysEqualAsSets(candidateLobIds, params.lobIds)) continue;
      if (!arraysEqualAsSets(candidateCobIds, params.cobIds)) continue;

      return candidate;
    }

    return null;
  }

  async getOrCreateForCarrier(
    params: GetOrCreateProductForCarrierParams,
    userId?: string,
    manager?: EntityManager,
  ): Promise<Product> {
    const existing = await this.findMatchingProduct(params, manager);
    if (existing) return existing;

    const em = manager ?? this.productReinsurerRepo.manager;
    const productRepo = em.getRepository(Product);
    const reinsurerRepo = em.getRepository(ProductReinsurer);

    const productId = await this.generateProductId(manager);
    const product = productRepo.create({
      productId,
      lobId: toCommaString(params.lobIds),
      cobId: toCommaString(params.cobIds),
      name: `${params.carrierName} - ${params.mgaName ?? 'No MGA'}`,
      riskCompanyId: params.riskCompanyId,
      mgaId: params.mgaId,
      isActive: true,
    });
    const saved = await productRepo.save(product);

    if (params.reinsurerIds.length > 0) {
      const rows = params.reinsurerIds.map(reinsurerId =>
        reinsurerRepo.create({ productId: saved.id, reinsurerId }),
      );
      await reinsurerRepo.save(rows);
    }

    return saved;
  }

  async createProduct(dto: CreateProductDto, userId?: string): Promise<ProductWithRelations> {
    let productId = dto.product_id;
    if (!productId) {
      productId = await this.generateProductId();
    } else {
      const exists = await this.dao.findByProductId(productId);
      if (exists) throw new BadRequestException(`Product ID ${productId} already exists`);
    }

    const product = this.dao.create({
      productId,
      lobId: toCommaString(dto.lob_id),
      cobId: toCommaString(dto.cob_id),
      name: dto.name,
      description: dto.description ?? null,
      isActive: dto.is_active ?? true,
    });
    const saved = await this.dao.save(product);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'create',
      entityType: 'product',
      entityId: saved.id,
      description: `Created Product ${saved.name} (${saved.productId})`,
    });
    return this.findOneProduct(saved.id);
  }

  async updateProduct(
    id: string,
    dto: UpdateProductDto,
    userId?: string,
  ): Promise<ProductWithRelations> {
    const product = await this.dao.findById(id);
    if (!product) throw new NotFoundException('Product not found');

    if (dto.product_id !== undefined && dto.product_id !== product.productId) {
      const exists = await this.dao.findByProductId(dto.product_id);
      if (exists) throw new BadRequestException(`Product ID ${dto.product_id} already exists`);
    }

    Object.assign(product, {
      productId: dto.product_id ?? product.productId,
      lobId: dto.lob_id !== undefined ? toCommaString(dto.lob_id) : product.lobId,
      cobId: dto.cob_id !== undefined ? toCommaString(dto.cob_id) : product.cobId,
      name: dto.name ?? product.name,
      description: dto.description ?? product.description,
      isActive: dto.is_active ?? product.isActive,
    });
    const saved = await this.dao.save(product);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'edit',
      entityType: 'product',
      entityId: saved.id,
      description: `Updated Product ${saved.name} (${saved.productId})`,
    });
    return this.findOneProduct(saved.id);
  }

  async deleteProduct(id: string, userId?: string): Promise<void> {
    const product = await this.findOneProduct(id);
    await this.dao.delete(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'delete',
      entityType: 'product',
      entityId: id,
      description: `Deleted Product ${product.name} (${product.productId})`,
    });
  }
}
