import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TreatyProductDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;
}

export class TreatyCarrierDto {
  @IsUUID()
  @IsNotEmpty()
  carrier_id: string;

  @IsNumber()
  @IsNotEmpty()
  pct: number;

  @IsUUID()
  @IsOptional()
  state_id?: string;
}

export class TreatyReinsurerDto {
  @IsUUID()
  @IsNotEmpty()
  reinsurer_id: string;

  @IsNumber()
  @IsNotEmpty()
  quota_share: number;
}

export class CreateTreatyDto {
  @IsString()
  @IsNotEmpty()
  treaty_code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsOptional()
  mga_id?: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  mga_ids?: string[];

  @IsUUID()
  @IsOptional()
  risk_company_id?: string;

  @IsDateString()
  @IsOptional()
  effective_date?: string;

  @IsDateString()
  @IsOptional()
  expiration_date?: string;

  @IsNumber()
  @IsOptional()
  qs_pct?: number;

  @IsNumber()
  @IsOptional()
  cf_pct?: number;

  @IsNumber()
  @IsOptional()
  comm_pct?: number;

  @IsNumber()
  @IsOptional()
  bb_pct?: number;

  @IsNumber()
  @IsOptional()
  ulae_pct?: number;

  @IsNumber()
  @IsOptional()
  xol_pct?: number;

  @IsNumber()
  @IsOptional()
  lr_cap_pct?: number;

  @IsNumber()
  @IsOptional()
  ibnr_pct?: number;

  @IsNumber()
  @IsOptional()
  lae_dcc_pct?: number;

  @IsNumber()
  @IsOptional()
  lae_aoe_pct?: number;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  state_ids?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatyProductDto)
  @IsOptional()
  products?: TreatyProductDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatyCarrierDto)
  @IsOptional()
  carriers?: TreatyCarrierDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatyReinsurerDto)
  @IsOptional()
  reinsurers?: TreatyReinsurerDto[];

  @IsUUID()
  @IsOptional()
  treaty_type_id?: string;

  @IsString()
  @IsOptional()
  carrier_allocation_type?: string;

  @IsString()
  @IsOptional()
  ulae_type?: string;

  @IsString()
  @IsOptional()
  ulae_basis?: string;

  @IsNumber()
  @IsOptional()
  ulae_flat_amount?: number;
}

export class UpdateTreatyDto {
  @IsString()
  @IsOptional()
  treaty_code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  mga_id?: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  mga_ids?: string[];

  @IsUUID()
  @IsOptional()
  risk_company_id?: string;

  @IsDateString()
  @IsOptional()
  effective_date?: string;

  @IsDateString()
  @IsOptional()
  expiration_date?: string;

  @IsNumber()
  @IsOptional()
  qs_pct?: number;

  @IsNumber()
  @IsOptional()
  cf_pct?: number;

  @IsNumber()
  @IsOptional()
  comm_pct?: number;

  @IsNumber()
  @IsOptional()
  bb_pct?: number;

  @IsNumber()
  @IsOptional()
  ulae_pct?: number;

  @IsNumber()
  @IsOptional()
  xol_pct?: number;

  @IsNumber()
  @IsOptional()
  lr_cap_pct?: number;

  @IsNumber()
  @IsOptional()
  ibnr_pct?: number;

  @IsNumber()
  @IsOptional()
  lae_dcc_pct?: number;

  @IsNumber()
  @IsOptional()
  lae_aoe_pct?: number;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  state_ids?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatyProductDto)
  @IsOptional()
  products?: TreatyProductDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatyCarrierDto)
  @IsOptional()
  carriers?: TreatyCarrierDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatyReinsurerDto)
  @IsOptional()
  reinsurers?: TreatyReinsurerDto[];

  @IsUUID()
  @IsOptional()
  treaty_type_id?: string;

  @IsString()
  @IsOptional()
  carrier_allocation_type?: string;

  @IsString()
  @IsOptional()
  ulae_type?: string;

  @IsString()
  @IsOptional()
  ulae_basis?: string;

  @IsNumber()
  @IsOptional()
  ulae_flat_amount?: number;
}
