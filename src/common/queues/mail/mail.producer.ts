import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MAIL_QUEUE, MailJobName, SendOtpJobData, SendInviteJobData } from './mail.types';

@Injectable()
export class MailProducer {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) {}

  enqueueOtp(data: SendOtpJobData) {
    return this.mailQueue.add(MailJobName.SEND_OTP, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
  }

  enqueueInvite(data: SendInviteJobData) {
    return this.mailQueue.add(MailJobName.SEND_INVITE, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
  }
}
