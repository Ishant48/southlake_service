import { Controller, Post, HttpCode, HttpStatus, Get, Put, Param, Body } from '@nestjs/common';
import { ItdSeederService } from '../services/itd-seeder.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('database')
@Public()
export class DatabaseController {
  constructor(private readonly itdSeederService: ItdSeederService) {}

  @Post('clear')
  @HttpCode(HttpStatus.OK)
  async clearDatabase() {
    return this.itdSeederService.clearAllData();
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedDatabase() {
    const seedResults = await this.itdSeederService.seedItdData();
    return {
      success: true,
      message: 'ITD Seed operation completed.',
      results: seedResults,
    };
  }

  @Get('check-itd-seeded')
  async checkItdSeeded() {
    return this.itdSeederService.checkItdSeeded();
  }

  @Get('seeder-files')
  getSeederFiles() {
    return this.itdSeederService.getSeederFiles();
  }

  @Put('seeder-files/:stateCode')
  @HttpCode(HttpStatus.OK)
  updateSeederFile(@Param('stateCode') stateCode: string, @Body() data: Record<string, unknown>) {
    return this.itdSeederService.updateSeederFile(stateCode, data);
  }
}
