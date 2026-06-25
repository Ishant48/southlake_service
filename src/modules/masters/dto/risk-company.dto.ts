import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateRiskCompanyDto {
  @IsString()
  @IsNotEmpty()
  risk_company_id: string;

  @IsNumber()
  @IsOptional()
  company_id?: number;

  @IsString()
  @IsOptional()
  id_name?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  is_admitted?: boolean;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateRiskCompanyDto {
  @IsString()
  @IsOptional()
  risk_company_id?: string;

  @IsNumber()
  @IsOptional()
  company_id?: number;

  @IsString()
  @IsOptional()
  id_name?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  is_admitted?: boolean;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
