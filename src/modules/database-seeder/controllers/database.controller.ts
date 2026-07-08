import { Controller, Post, HttpCode, HttpStatus, Get, Put, Param, Body } from '@nestjs/common';
import { ItdSeederService } from '../services/itd-seeder.service';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@Controller('database')
export class DatabaseController {
  constructor(private readonly itdSeederService: ItdSeederService) {}

  @Post('clear')
  @RequirePermission('database_seeder.manage')
  @HttpCode(HttpStatus.OK)
  async clearDatabase() {
    return this.itdSeederService.clearAllData();
  }

  @Post('seed')
  @RequirePermission('database_seeder.manage')
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
  @RequirePermission('database_seeder.view')
  async checkItdSeeded() {
    return this.itdSeederService.checkItdSeeded();
  }

  @Get('seeder-files')
  @RequirePermission('database_seeder.view')
  getSeederFiles() {
    return this.itdSeederService.getSeederFiles();
  }

  @Put('seeder-files/:stateCode')
  @RequirePermission('database_seeder.manage')
  @HttpCode(HttpStatus.OK)
  updateSeederFile(@Param('stateCode') stateCode: string, @Body() data: Record<string, unknown>) {
    return this.itdSeederService.updateSeederFile(stateCode, data);
  }
}
