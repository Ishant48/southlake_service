import { plainToInstance, Transform } from 'class-transformer';
import { validateSync, IsString, IsOptional, IsIn, IsNumber, IsNotEmpty } from 'class-validator';

class EnvVars {
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string;

  @Transform(({ value }: { value: unknown }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  PORT?: number;

  // Database
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsNotEmpty()
  DATABASE_HOST: string;

  @Transform(({ value }: { value: unknown }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  DATABASE_PORT?: number;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsNotEmpty()
  DATABASE_NAME: string;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsNotEmpty()
  DATABASE_USER: string;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  DATABASE_PASSWORD?: string;

  // Auth
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  // App
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  APP_URL?: string;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsNumber()
  @IsOptional()
  SESSION_EXPIRY_HOURS?: number;

  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsNumber()
  @IsOptional()
  OTP_EXPIRY_MINUTES?: number;

  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsNumber()
  @IsOptional()
  OTP_MAX_ATTEMPTS?: number;

  // Mail
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  MAIL_HOST?: string;

  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsNumber()
  @IsOptional()
  MAIL_PORT?: number;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  MAIL_USER?: string;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  MAIL_PASSWORD?: string;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  MAIL_FROM?: string;

  // Redis
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsNumber()
  @IsOptional()
  REDIS_PORT?: number;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  // Rate Limiting
  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsNumber()
  @IsOptional()
  RATE_LIMIT_TTL?: number;

  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsNumber()
  @IsOptional()
  RATE_LIMIT_MAX?: number;

  // Logging
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  @IsIn(['debug', 'info', 'warn', 'error'])
  LOG_LEVEL?: string;

  // Bull Board
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  BULL_BOARD_PATH?: string;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  BULL_BOARD_USERNAME?: string;

  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  BULL_BOARD_PASSWORD?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvVars, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map(err => {
        const constraints = Object.values(err.constraints || {}).join(', ');
        return `  - ${err.property}: ${constraints}`;
      })
      .join('\n');
    throw new Error(`Env validation failed:\n${messages}`);
  }

  return validatedConfig;
}
