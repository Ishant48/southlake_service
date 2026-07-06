import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { InvitesController } from './invites.controller';
import { UsersService } from './users.service';
import { UsersDao } from './dao/users.dao';
import { MailModule } from '../mail/mail.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { User } from './entities/user.entity';
import { UserPermission } from './entities/user-permission.entity';
import { PendingInvite } from './entities/pending-invite.entity';
import { Role } from '../roles/entities/role.entity';
import { PermissionCacheModule } from '../../common/cache/permission-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserPermission, PendingInvite, Role]),
    MailModule,
    ActivityLogsModule,
    PermissionCacheModule,
  ],
  controllers: [UsersController, InvitesController],
  providers: [UsersService, UsersDao],
  exports: [UsersService, UsersDao],
})
export class UsersModule {}
