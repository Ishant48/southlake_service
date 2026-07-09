import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsOptional()
  product_id?: string;

  @IsOptional()
  lob_id?: string | string[];

  @IsOptional()
  cob_id?: string | string[];

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
  lob_id?: string | string[];

  @IsOptional()
  cob_id?: string | string[];

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
