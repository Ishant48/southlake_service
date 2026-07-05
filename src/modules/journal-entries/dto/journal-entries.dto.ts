import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JournalEntryLineDto {
  @ApiProperty({ description: 'Description of the entry line' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Chart of Account UUID' })
  @IsNotEmpty()
  @IsUUID()
  coa_id: string;

  @ApiPropertyOptional({ description: 'Subledger identifier (e.g. MGA code)' })
  @IsOptional()
  @IsString()
  sub?: string;

  @ApiPropertyOptional({ description: 'Debit amount' })
  @IsOptional()
  @IsNumber()
  debit?: number;

  @ApiPropertyOptional({ description: 'Credit amount' })
  @IsOptional()
  @IsNumber()
  credit?: number;

  @ApiPropertyOptional({ description: 'Date of entry (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Department code' })
  @IsOptional()
  @IsString()
  dp?: string;

  @ApiPropertyOptional({ description: 'Policy number' })
  @IsOptional()
  @IsString()
  policy?: string;

  @ApiPropertyOptional({ description: 'Memo' })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class PostJournalEntriesDto {
  @ApiProperty({ description: 'Journal Entry number' })
  @IsNotEmpty()
  @IsNumber()
  je_number: number;

  @ApiProperty({
    description: 'List of entry lines in the transaction',
    type: [JournalEntryLineDto],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}
