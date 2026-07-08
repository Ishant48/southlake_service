import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSequencePrefixMasterDto {
  @IsString()
  @IsNotEmpty()
  sequence_type: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  prefix: string;

  @IsString()
  @IsOptional()
  prefix_connector?: string;

  @IsNumber()
  @IsOptional()
  seq_start?: number;

  @IsNumber()
  @IsOptional()
  next_number?: number;

  @IsString()
  @IsOptional()
  suffix?: string;

  @IsString()
  @IsOptional()
  suffix_connector?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateSequencePrefixMasterDto {
  @IsString()
  @IsOptional()
  sequence_type?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsString()
  @IsOptional()
  prefix_connector?: string;

  @IsNumber()
  @IsOptional()
  seq_start?: number;

  @IsNumber()
  @IsOptional()
  next_number?: number;

  @IsString()
  @IsOptional()
  suffix?: string;

  @IsString()
  @IsOptional()
  suffix_connector?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
