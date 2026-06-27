import { Injectable } from '@nestjs/common';
import { PriorityQueueProducer } from '../queues/priority/priority-queue.producer';
import { OtpPayload, InvitePayload } from './interfaces/communication.interface';

@Injectable()
export class CommunicationService {
  constructor(private readonly queueProducer: PriorityQueueProducer) {}

  sendOtp(payload: OtpPayload) {
    return this.queueProducer.enqueueOtp({ to: payload.to, otp: payload.otp });
  }

  sendInvite(payload: InvitePayload) {
    return this.queueProducer.enqueueInvite({
      to: payload.to,
      name: payload.name,
      inviteLink: payload.inviteLink,
      invitedByName: payload.invitedByName,
    });
  }
}
