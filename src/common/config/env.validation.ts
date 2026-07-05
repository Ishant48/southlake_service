import { plainToInstance, Transform } from 'class-transformer';
import { validateSync, IsString, IsOptional, IsIn, IsNumber, IsNotEmpty } from 'class-validator';

/**
 * Shape of the process environment this service actually reads.
 * Keep this list in sync with the real `process.env.*` / `ConfigService.get()`
 * lookups in src/config/*.config.ts and module code — do not add speculative vars.
 */
class EnvVars {
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  @IsString()
  @IsIn(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV?: string;

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

  // Rate limiting
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
}

/**
 * Wired into ConfigModule.forRoot({ validate }) so the app fails fast on
 * boot with a readable error instead of surfacing a missing-env-var bug
 * deep in a request handler.
 */
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
        const constraints = Object.values(err.constraints ?? {}).join(', ');
        return `  - ${err.property}: ${constraints}`;
      })
      .join('\n');
    throw new Error(`Env validation failed:\n${messages}`);
  }

  return validatedConfig;
}
