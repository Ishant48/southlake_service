import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../../../modules/mail/mail.service';
import { MAIL_QUEUE, MailJobName, SendOtpJobData, SendInviteJobData } from './mail.types';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case MailJobName.SEND_OTP: {
        const { to, otp } = job.data as SendOtpJobData;
        await this.mailService.sendOtp(to, otp);
        break;
      }
      case MailJobName.SEND_INVITE: {
        const { to, name, inviteLink, invitedByName } = job.data as SendInviteJobData;
        await this.mailService.sendInvite(to, name, inviteLink, invitedByName);
        break;
      }
      default:
        this.logger.warn(`Unknown mail job: ${job.name}`);
    }
  }
}
