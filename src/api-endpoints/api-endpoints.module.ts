import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiEndpoint } from './entities/api-endpoint.entity';
import { ApiEndpointsService } from './api-endpoints.service';
import { ApiEndpointsController } from './api-endpoints.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApiEndpoint])],
  controllers: [ApiEndpointsController],
  providers: [ApiEndpointsService],
  exports: [ApiEndpointsService],
})
export class ApiEndpointsModule {}
