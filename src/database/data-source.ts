import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  database: process.env.DATABASE_NAME || 'southlake_db',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  entities: [resolve(__dirname, '../entities/**/*.entity.{ts,js}')],
  migrations: [resolve(__dirname, './migrations/**/*.{ts,js}')],
  synchronize: false,
  logging: true,
});
