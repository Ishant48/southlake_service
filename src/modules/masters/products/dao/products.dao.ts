import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';

@Injectable()
export class ProductsDao {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<Product[]> {
    const where: FindOptionsWhere<Product>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        productId: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<Product> = { isDeleted: false };
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.productRepo.find({
      where: where.length > 1 ? where : where[0],
      relations: ['lob', 'cob'],
      order: { productId: 'ASC' },
    });
  }

  findById(id: string): Promise<Product | null> {
    return this.productRepo.findOne({
      where: { id },
      relations: ['lob', 'cob'],
    });
  }

  findByProductId(productId: string): Promise<Product | null> {
    return this.productRepo.findOne({ where: { productId } });
  }

  create(data: Partial<Product>): Product {
    return this.productRepo.create(data);
  }

  save(product: Product): Promise<Product> {
    return this.productRepo.save(product);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.productRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.productRepo.save(entity);
  }
}
