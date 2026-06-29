import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateRatesDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  qs?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  cf?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  comm?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  bb?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  ulae?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  xol?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  lr?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  lossPick?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  laeDcc?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  laeAoe?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  boardsCharge?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  lossRatioCap?: number;
}
