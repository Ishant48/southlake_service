import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateMgaDto {
  @IsString()
  @IsNotEmpty()
  mga_code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  ledger_amount?: number;

  @IsOptional()
  company_id?: string | number;

  @IsString()
  @IsOptional()
  id_name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  zip?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  open_item?: boolean;

  @IsOptional()
  op_start_date?: string | Date;
}

export class UpdateMgaDto {
  @IsString()
  @IsOptional()
  mga_code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  ledger_amount?: number;

  @IsOptional()
  company_id?: string | number;

  @IsString()
  @IsOptional()
  id_name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  zip?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  open_item?: boolean;

  @IsOptional()
  op_start_date?: string | Date;
}
