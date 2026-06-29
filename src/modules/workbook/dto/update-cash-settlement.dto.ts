import { IsNumber, IsOptional } from 'class-validator';

export class UpdateCashSettlementDto {
  @IsNumber()
  @IsOptional()
  begBal?: number;

  @IsNumber()
  @IsOptional()
  amtPaid?: number;
}
