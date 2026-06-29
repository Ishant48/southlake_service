import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class UpdateExhibitDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  pw?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  pfw?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  pc?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  pfc?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  tax?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  lp?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  laep?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  ae_paid?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  pe?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  pfe?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  uep?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  lu?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  laeu?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  aeu?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  loss_reserves?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  loss_ibnr?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  lae_reserves_dcc?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  lae_ibnr_dcc?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  lae_reserves_aoe?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  lae_ibnr_aoe?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  ulae_ibnr?: number[];
}
