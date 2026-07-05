import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { ProductsDao } from './dao/products.dao';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

/** CRUD for product master records. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly dao: ProductsDao,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAllProducts(search?: string, isActive?: boolean): Promise<Product[]> {
    return this.dao.findAll(search, isActive);
  }

  async findOneProduct(id: string): Promise<Product> {
    const product = await this.dao.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(dto: CreateProductDto, userId?: string): Promise<Product> {
    const exists = await this.dao.findByProductId(dto.product_id);
    if (exists) throw new BadRequestException(`Product ID ${dto.product_id} already exists`);

    const product = this.dao.create({
      productId: dto.product_id,
      lobId: dto.lob_id,
      cobId: dto.cob_id,
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

  async updateProduct(id: string, dto: UpdateProductDto, userId?: string): Promise<Product> {
    const product = await this.findOneProduct(id);
    if (dto.product_id !== undefined && dto.product_id !== product.productId) {
      const exists = await this.dao.findByProductId(dto.product_id);
      if (exists) throw new BadRequestException(`Product ID ${dto.product_id} already exists`);
    }

    Object.assign(product, {
      productId: dto.product_id ?? product.productId,
      lobId: dto.lob_id ?? product.lobId,
      cobId: dto.cob_id ?? product.cobId,
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
