import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) throw new Error('DATABASE_URL is not set');

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
            await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
          }
        } finally {
          await client.end();
        }

        return {
          type: 'postgres',
          url: connectionString,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
