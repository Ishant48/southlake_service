import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { ProductsDao } from './dao/products.dao';
import { Product } from '../entities/product.entity';
import { ProductLob } from '../entities/product-lob.entity';
import { ProductCob } from '../entities/product-cob.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

/** CRUD for product master records, including LOB/COB junction tables. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly dao: ProductsDao,
    private readonly activityLogsService: ActivityLogsService,
    private readonly dataSource: DataSource,
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
    const exists = await this.dao.findByProductCode(dto.product_code);
    if (exists) throw new BadRequestException(`Product ID ${dto.product_code} already exists`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = queryRunner.manager.create(Product, {
        productCode: dto.product_code,
        name: dto.name,
        description: dto.description ?? null,
        isActive: dto.is_active ?? true,
      });
      const saved = await queryRunner.manager.save(Product, product);

      if (dto.lob_ids && dto.lob_ids.length > 0) {
        const lobs = dto.lob_ids.map(lobId =>
          queryRunner.manager.create(ProductLob, {
            productId: saved.id,
            lobId,
          }),
        );
        await queryRunner.manager.save(ProductLob, lobs);
      }

      if (dto.cob_ids && dto.cob_ids.length > 0) {
        const cobs = dto.cob_ids.map(cobId =>
          queryRunner.manager.create(ProductCob, {
            productId: saved.id,
            cobId,
          }),
        );
        await queryRunner.manager.save(ProductCob, cobs);
      }

      await queryRunner.commitTransaction();
      await this.activityLogsService.log({
        userId,
        moduleId: 'master_data',
        action: 'create',
        description: `Created Product ${saved.name} (${saved.productCode})`,
      });
      return this.findOneProduct(saved.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateProduct(id: string, dto: UpdateProductDto, userId?: string): Promise<Product> {
    const product = await this.findOneProduct(id);
    if (dto.product_code !== undefined && dto.product_code !== product.productCode) {
      const exists = await this.dao.findByProductCode(dto.product_code);
      if (exists) throw new BadRequestException(`Product ID ${dto.product_code} already exists`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(product, {
        productCode: dto.product_code ?? product.productCode,
        name: dto.name ?? product.name,
        description: dto.description ?? product.description,
        isActive: dto.is_active ?? product.isActive,
      });
      await queryRunner.manager.save(Product, product);

      if (dto.lob_ids !== undefined) {
        await queryRunner.manager.delete(ProductLob, { productId: id });
        if (dto.lob_ids.length > 0) {
          const lobs = dto.lob_ids.map(lobId =>
            queryRunner.manager.create(ProductLob, {
              productId: id,
              lobId,
            }),
          );
          await queryRunner.manager.save(ProductLob, lobs);
        }
      }

      if (dto.cob_ids !== undefined) {
        await queryRunner.manager.delete(ProductCob, { productId: id });
        if (dto.cob_ids.length > 0) {
          const cobs = dto.cob_ids.map(cobId =>
            queryRunner.manager.create(ProductCob, {
              productId: id,
              cobId,
            }),
          );
          await queryRunner.manager.save(ProductCob, cobs);
        }
      }

      await queryRunner.commitTransaction();
      await this.activityLogsService.log({
        userId,
        moduleId: 'master_data',
        action: 'edit',
        description: `Updated Product ${product.name} (${product.productCode})`,
      });
      return this.findOneProduct(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProduct(id: string, userId?: string): Promise<void> {
    const product = await this.findOneProduct(id);
    await this.dao.delete(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'delete',
      description: `Deleted Product ${product.name} (${product.productCode})`,
    });
  }
}
