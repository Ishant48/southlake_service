import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { ProductsDao } from './dao/products.dao';
import { Product } from '../entities/product.entity';
import { LineOfBusiness } from '../entities/line-of-business.entity';
import { CobMaster } from '../entities/cob-master.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

export interface ProductWithRelations extends Product {
  lobs: LineOfBusiness[];
  cobs: CobMaster[];
  lob: LineOfBusiness | null;
  cob: CobMaster | null;
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

/** CRUD for product master records. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly dao: ProductsDao,
    private readonly activityLogsService: ActivityLogsService,
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

  async createProduct(dto: CreateProductDto, userId?: string): Promise<ProductWithRelations> {
    const exists = await this.dao.findByProductId(dto.product_id);
    if (exists) throw new BadRequestException(`Product ID ${dto.product_id} already exists`);

    const product = this.dao.create({
      productId: dto.product_id,
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
