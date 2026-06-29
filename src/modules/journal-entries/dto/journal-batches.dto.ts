import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJournalBatchDto {
  @ApiProperty({ description: 'Batch number' })
  @IsNotEmpty()
  @IsString()
  batch_number: string;

  @ApiProperty({ description: 'Process period (e.g. June 2026)' })
  @IsNotEmpty()
  @IsString()
  period: string;

  @ApiProperty({ description: 'Agent Name (MGA name)' })
  @IsNotEmpty()
  @IsString()
  agent_name: string;
}

export class UpdateJournalBatchDto {
  @ApiPropertyOptional({ description: 'Batch number' })
  @IsOptional()
  @IsString()
  batch_number?: string;

  @ApiPropertyOptional({ description: 'Process period (e.g. June 2026)' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Agent Name (MGA name)' })
  @IsOptional()
  @IsString()
  agent_name?: string;
}
