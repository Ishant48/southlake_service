import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTreatyTypeDto {
  @IsString()
  @IsNotEmpty()
  type_code: string;

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

export class UpdateTreatyTypeDto {
  @IsString()
  @IsOptional()
  type_code?: string;

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
