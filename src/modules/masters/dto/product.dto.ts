import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsNotEmpty()
  lob_id: string;

  @IsUUID()
  @IsNotEmpty()
  cob_id: string;

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

  @IsUUID()
  @IsOptional()
  lob_id?: string;

  @IsUUID()
  @IsOptional()
  cob_id?: string;

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
