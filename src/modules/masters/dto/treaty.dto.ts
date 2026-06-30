import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TreatyLobDto {
  @IsUUID()
  @IsNotEmpty()
  lob_id: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  cob_ids?: string[];
}

export class TreatyCarrierDto {
  @IsUUID()
  @IsNotEmpty()
  risk_company_id: string;

  @IsNumber()
  @IsNotEmpty()
  retention_pct: number;
}

export class TreatyReinsurerDto {
  @IsUUID()
  @IsNotEmpty()
  reinsurer_id: string;

  @IsNumber()
  @IsNotEmpty()
  cession_pct: number;
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
  reinsurer_id?: string;

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

  @IsNumber()
  @IsOptional()
  carrier_retention_pct?: number;

  @IsNumber()
  @IsOptional()
  reinsurer_cession_pct?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  state_ids?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatyLobDto)
  @IsOptional()
  lobs?: TreatyLobDto[];

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
  reinsurer_id?: string;

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

  @IsNumber()
  @IsOptional()
  carrier_retention_pct?: number;

  @IsNumber()
  @IsOptional()
  reinsurer_cession_pct?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  state_ids?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatyLobDto)
  @IsOptional()
  lobs?: TreatyLobDto[];

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
}
