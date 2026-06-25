import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
