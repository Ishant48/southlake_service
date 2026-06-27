import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from '../../../modules/mail/mail.module';
import { MailProducer } from './mail.producer';
import { MailProcessor } from './mail.processor';
import { MAIL_QUEUE } from './mail.types';

@Module({
  imports: [BullModule.registerQueue({ name: MAIL_QUEUE }), MailModule],
  providers: [MailProducer, MailProcessor],
  exports: [MailProducer],
})
export class MailQueueModule {}
