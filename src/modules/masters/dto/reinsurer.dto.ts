import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReinsurerDto {
  @IsString()
  @IsNotEmpty()
  reinsurer_company_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateReinsurerDto {
  @IsString()
  @IsOptional()
  reinsurer_company_id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
