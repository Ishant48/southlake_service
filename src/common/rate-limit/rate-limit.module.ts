import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('RATE_LIMIT_TTL') ?? 60000,
            limit: configService.get<number>('RATE_LIMIT_MAX') ?? 100,
          },
          {
            name: 'short',
            ttl: (configService.get<number>('RATE_LIMIT_TTL') ?? 60) * 1000 * 5,
            limit: (configService.get<number>('RATE_LIMIT_MAX') ?? 100) * 3,
          },
        ],
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
