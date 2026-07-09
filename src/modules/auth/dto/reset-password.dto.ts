import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'b06b6fb4762a52f086f15a9e8930dbb32af9771f943e8f7e3796bcd9b27a7835' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'SecretPassword@123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
