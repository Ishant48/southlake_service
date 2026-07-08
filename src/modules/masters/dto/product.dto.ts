import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  product_code: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  lob_ids?: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  cob_ids?: string[];

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
  product_code?: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  lob_ids?: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  cob_ids?: string[];

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
