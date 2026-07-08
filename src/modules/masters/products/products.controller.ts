import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

@ApiTags('masters')
@ApiBearerAuth()
@Controller('masters')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get('products')
  @RequirePermission('product.view')
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAllProducts(@Query('search') search?: string, @Query('is_active') isActive?: boolean) {
    const active = isActive !== undefined ? String(isActive) === 'true' : undefined;
    return this.service.findAllProducts(search, active);
  }

  @Get('products/:id')
  @RequirePermission('product.view')
  @ApiOperation({ summary: 'Get one product details' })
  findOneProduct(@Param('id') id: string) {
    return this.service.findOneProduct(id);
  }

  @Post('products')
  @RequirePermission('product.create')
  @ApiOperation({ summary: 'Create product' })
  createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: User) {
    return this.service.createProduct(dto, user.id);
  }

  @Patch('products/:id')
  @RequirePermission('product.edit')
  @ApiOperation({ summary: 'Update product' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: User) {
    return this.service.updateProduct(id, dto, user.id);
  }

  @Delete('products/:id')
  @RequirePermission('product.delete')
  @ApiOperation({ summary: 'Delete product' })
  deleteProduct(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.deleteProduct(id, user.id);
  }
}
