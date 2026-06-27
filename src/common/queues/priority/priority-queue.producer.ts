import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import { QueuePriority } from './queue-priority.enum';
import { PriorityJobName, SendOtpPayload, SendInvitePayload } from './priority-queue.types';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
  removeOnFail: 100,
};

@Injectable()
export class PriorityQueueProducer {
  private readonly queueMap: Record<QueuePriority, Queue>;

  constructor(
    @InjectQueue(QueuePriority.P0) private readonly p0: Queue,
    @InjectQueue(QueuePriority.P1) private readonly p1: Queue,
    @InjectQueue(QueuePriority.P2) private readonly p2: Queue,
    @InjectQueue(QueuePriority.P3) private readonly p3: Queue,
    @InjectQueue(QueuePriority.P4) private readonly p4: Queue,
    @InjectQueue(QueuePriority.P5) private readonly p5: Queue,
    @InjectQueue(QueuePriority.P6) private readonly p6: Queue,
    @InjectQueue(QueuePriority.P7) private readonly p7: Queue,
  ) {
    this.queueMap = {
      [QueuePriority.P0]: this.p0,
      [QueuePriority.P1]: this.p1,
      [QueuePriority.P2]: this.p2,
      [QueuePriority.P3]: this.p3,
      [QueuePriority.P4]: this.p4,
      [QueuePriority.P5]: this.p5,
      [QueuePriority.P6]: this.p6,
      [QueuePriority.P7]: this.p7,
    };
  }

  enqueue(priority: QueuePriority, jobName: string, data: unknown, options?: JobsOptions) {
    return this.queueMap[priority].add(jobName, data, { ...DEFAULT_JOB_OPTIONS, ...options });
  }

  enqueueOtp(data: SendOtpPayload) {
    return this.enqueue(QueuePriority.P0, PriorityJobName.SEND_OTP, data);
  }

  enqueueInvite(data: SendInvitePayload) {
    return this.enqueue(QueuePriority.P3, PriorityJobName.SEND_INVITE, data);
  }
}
