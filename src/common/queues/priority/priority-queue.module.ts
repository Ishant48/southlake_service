import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueuePriority } from './queue-priority.enum';
import { PriorityQueueProducer } from './priority-queue.producer';
import { ALL_PRIORITY_PROCESSORS } from './priority-queue.processors';
import { MailModule } from '../../../modules/mail/mail.module';

const PRIORITY_QUEUES = Object.values(QueuePriority).map(name => ({ name }));

@Module({
  imports: [BullModule.registerQueue(...PRIORITY_QUEUES), MailModule],
  providers: [PriorityQueueProducer, ...ALL_PRIORITY_PROCESSORS],
  exports: [PriorityQueueProducer],
})
export class PriorityQueueModule {}
