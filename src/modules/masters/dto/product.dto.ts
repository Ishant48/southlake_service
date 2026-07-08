import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsOptional()
  lob_id?: any;

  @IsOptional()
  cob_id?: any;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  product_id?: string;

  @IsOptional()
  lob_id?: any;

  @IsOptional()
  cob_id?: any;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
