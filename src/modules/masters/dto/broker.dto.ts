import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class CreateBrokerDto {
  @IsString()
  @IsNotEmpty()
  broker_code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  contact_name?: string;

  @IsEmail()
  @IsOptional()
  contact_email?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateBrokerDto {
  @IsString()
  @IsOptional()
  broker_code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  contact_name?: string;

  @IsEmail()
  @IsOptional()
  contact_email?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
