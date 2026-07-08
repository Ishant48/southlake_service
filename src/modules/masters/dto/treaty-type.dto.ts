import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTreatyTypeDto {
  @IsString()
  @IsNotEmpty()
  type_code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTreatyTypeDto {
  @IsString()
  @IsOptional()
  type_code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
