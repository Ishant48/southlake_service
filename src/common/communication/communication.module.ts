import { Module } from '@nestjs/common';
import { PriorityQueueModule } from '../queues/priority/priority-queue.module';
import { CommunicationService } from './communication.service';

@Module({
  imports: [PriorityQueueModule],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
