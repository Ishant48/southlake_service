import { Logger } from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../../../modules/mail/mail.service';
import { PriorityJobName, SendOtpPayload, SendInvitePayload } from './priority-queue.types';

export class BasePriorityProcessor extends WorkerHost {
  protected readonly logger = new Logger(BasePriorityProcessor.name);

  constructor(protected readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case PriorityJobName.SEND_OTP: {
        const { to, otp } = job.data as SendOtpPayload;
        await this.mailService.sendOtp(to, otp);
        break;
      }
      case PriorityJobName.SEND_INVITE: {
        const { to, name, inviteLink, invitedByName } = job.data as SendInvitePayload;
        await this.mailService.sendInvite(to, name, inviteLink, invitedByName);
        break;
      }
      default:
        this.logger.warn(`Unhandled job "${job.name}" on queue "${job.queueName}"`);
    }
  }
}
