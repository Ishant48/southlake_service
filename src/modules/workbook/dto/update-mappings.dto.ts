import { IsString, IsOptional } from 'class-validator';

export class UpdateMappingsDto {
  @IsString()
  @IsOptional()
  mga?: string;

  @IsString()
  @IsOptional()
  lob?: string;

  @IsString()
  @IsOptional()
  lineDescSuffix?: string;

  @IsString()
  @IsOptional()
  comp?: string;

  @IsString()
  @IsOptional()
  cc?: string;

  @IsString()
  @IsOptional()
  ext?: string;

  @IsString()
  @IsOptional()
  sub?: string;
}
