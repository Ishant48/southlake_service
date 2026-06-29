import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

export class CreateChartOfAccountDto {
  @IsInt()
  account_code: number;

  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  description: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @IsBoolean()
  @IsOptional()
  is_parent?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['debit', 'credit'])
  normal_balance?: string;

  @IsInt()
  @IsOptional()
  next_number?: number;

  @IsUUID()
  @IsOptional()
  earning_account_id?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
