import { IsNotEmpty, IsString, IsUUID, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_TYPES = ['AR', 'AP', 'MGA', 'BRK'];

export class CreateGlMappingDto {
  @ApiProperty({ description: 'Chart of account UUID' })
  @IsNotEmpty()
  @IsUUID()
  coa_id: string;

  @ApiProperty({ description: 'Mapping Type (AR, AP, MGA, BRK)', enum: VALID_TYPES })
  @IsNotEmpty()
  @IsString()
  @IsIn(VALID_TYPES)
  type: string;
}

export class UpdateGlMappingDto {
  @ApiPropertyOptional({ description: 'Chart of account UUID' })
  @IsOptional()
  @IsUUID()
  coa_id?: string;

  @ApiPropertyOptional({ description: 'Mapping Type (AR, AP, MGA, BRK)', enum: VALID_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(VALID_TYPES)
  type?: string;
}
