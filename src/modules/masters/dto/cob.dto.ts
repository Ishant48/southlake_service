import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCobDto {
  @IsString()
  @IsNotEmpty()
  cob_code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateCobDto {
  @IsString()
  @IsOptional()
  cob_code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
