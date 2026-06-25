import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsNumber, Length } from 'class-validator';

export class CreateStateDto {
  @IsNumber()
  @IsOptional()
  state_code?: number;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  state_abbr: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateStateDto {
  @IsNumber()
  @IsOptional()
  state_code?: number;

  @IsString()
  @IsOptional()
  @Length(2, 2)
  state_abbr?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
