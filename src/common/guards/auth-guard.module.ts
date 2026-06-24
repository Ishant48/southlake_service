import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from './auth.guard';
import { UserSession } from '../../entities/user-session.entity';
import { User } from '../../entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserSession, User])],
  providers: [
    AuthGuard,
    { provide: APP_GUARD, useExisting: AuthGuard },
  ],
  exports: [AuthGuard],
})
export class AuthGuardModule {}
