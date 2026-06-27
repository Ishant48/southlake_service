import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalBatchDto, UpdateJournalBatchDto } from './dto/journal-batches.dto';
import { PostJournalEntriesDto } from './dto/journal-entries.dto';
import { JournalEntryBatch } from '../../entities/journal-entry-batch.entity';
import { JournalEntry } from '../../entities/journal-entry.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('Journal Entries')
@ApiBearerAuth()
@Controller('journal-batches')
export class JournalEntriesController {
  constructor(private readonly service: JournalEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all journal entry batches' })
  @ApiQuery({ name: 'period', required: false, description: 'Filter by process period' })
  @ApiQuery({ name: 'agent', required: false, description: 'Filter by agent name' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by batch number' })
  async findBatches(
    @Query('period') period?: string,
    @Query('agent') agent?: string,
    @Query('search') search?: string,
  ): Promise<JournalEntryBatch[]> {
    return this.service.findBatches(period, agent, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a journal entry batch by ID' })
  @ApiResponse({ status: 200, description: 'Return the journal batch.' })
  @ApiResponse({ status: 404, description: 'Batch not found.' })
  async findOneBatch(@Param('id') id: string): Promise<JournalEntryBatch> {
    return this.service.findOneBatch(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new journal entry batch' })
  async createBatch(
    @Body() dto: CreateJournalBatchDto,
    @CurrentUser() user: User,
  ): Promise<JournalEntryBatch> {
    return this.service.createBatch(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry batch' })
  async updateBatch(
    @Param('id') id: string,
    @Body() dto: UpdateJournalBatchDto,
    @CurrentUser() user: User,
  ): Promise<JournalEntryBatch> {
    return this.service.updateBatch(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a journal entry batch' })
  async removeBatch(@Param('id') id: string): Promise<void> {
    return this.service.removeBatch(id);
  }

  @Get(':id/entries')
  @ApiOperation({ summary: 'Get all entries inside a batch' })
  async findBatchEntries(@Param('id') id: string): Promise<JournalEntry[]> {
    return this.service.findBatchEntries(id);
  }

  @Post(':id/entries')
  @ApiOperation({ summary: 'Post balanced journal entry lines' })
  async postEntries(
    @Param('id') id: string,
    @Body() dto: PostJournalEntriesDto,
  ): Promise<JournalEntry[]> {
    return this.service.postEntries(id, dto);
  }
}
