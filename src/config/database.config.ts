import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '', 10) || 5432,
  name: process.env.DATABASE_NAME ?? 'southlake_db',
  user: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  poolMax: parseInt(process.env.DB_POOL_MAX ?? '', 10) || 20,
  poolIdleTimeoutMillis: 30000,
  poolConnectionTimeoutMillis: 5000,
}));
