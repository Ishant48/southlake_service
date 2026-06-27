import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { User } from './entities/user.entity';

@ApiTags('invites')
@ApiBearerAuth()
@Controller('invites')
export class InvitesController {
  constructor(private readonly service: UsersService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending invitations' })
  @ApiResponse({ status: 200, description: 'Pending invites' })
  getPending() {
    return this.service.getPendingInvites();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  @ApiResponse({ status: 200, description: 'Invite revoked' })
  revoke(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: User) {
    return this.service.revokeInvite(id, user);
  }
}
