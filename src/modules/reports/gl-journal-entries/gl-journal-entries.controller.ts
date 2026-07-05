import { Controller, Get, Post, Param, ParseIntPipe, Body } from '@nestjs/common';
import { GlJournalEntriesService, GlJournalEntryRow } from './gl-journal-entries.service';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('workbooks')
@Public()
export class GlJournalEntriesController {
  constructor(private readonly glJournalEntriesService: GlJournalEntriesService) {}

  @Get(':id/gl-journal-entries/:stateCode')
  async getGLJournalEntries(
    @Param('id', ParseIntPipe) id: number,
    @Param('stateCode') stateCode: string,
  ) {
    return this.glJournalEntriesService.getGLJournalEntries(id, stateCode.toUpperCase());
  }

  @Post(':id/post-to-journal-entries/:stateCode')
  async postToJournalEntries(
    @Param('id', ParseIntPipe) id: number,
    @Param('stateCode') stateCode: string,
    @CurrentUser() user: User,
    @Body() body?: { customRows?: GlJournalEntryRow[] },
  ) {
    return this.glJournalEntriesService.postToJournalEntries(
      id,
      stateCode.toUpperCase(),
      user?.id,
      body?.customRows,
    );
  }
}
