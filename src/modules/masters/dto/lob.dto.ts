import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateLobDto {
  @IsString()
  @IsNotEmpty()
  lob_code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  taxable?: boolean;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  fully_earned?: boolean;
}

export class UpdateLobDto {
  @IsString()
  @IsOptional()
  lob_code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  taxable?: boolean;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  fully_earned?: boolean;
}
