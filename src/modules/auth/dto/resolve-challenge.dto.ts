import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class ResolveChallengeDto {
  @ApiProperty({ example: 'abc123challengetoken' })
  @IsString()
  challenge_token: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  accept: boolean;
}
