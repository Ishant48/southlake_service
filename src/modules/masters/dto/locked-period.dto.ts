import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLockedPeriodDto {
  @IsString()
  @IsNotEmpty()
  period: string; // e.g. 'June 2026'

  @IsBoolean()
  @IsOptional()
  is_locked?: boolean;
}

export class UpdateLockedPeriodDto {
  @IsString()
  @IsOptional()
  period?: string;

  @IsBoolean()
  @IsOptional()
  is_locked?: boolean;
}
