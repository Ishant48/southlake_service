import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const url = new URL(connectionString);
    const dbName = url.pathname.replace(/^\//, '');
    url.pathname = '/postgres';

    const client = new Client({ connectionString: url.toString() });
    try {
      await client.connect();
      const result = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName],
      );
      if (result.rows.length === 0) {
        this.logger.log(`Database "${dbName}" does not exist. Creating...`);
        await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
        this.logger.log(`Database "${dbName}" created successfully.`);
      } else {
        this.logger.log(`Database "${dbName}" already exists.`);
      }
    } finally {
      await client.end();
    }
  }
}
