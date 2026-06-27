import { Processor } from '@nestjs/bullmq';
import { QueuePriority } from './queue-priority.enum';
import { BasePriorityProcessor } from './base-priority.processor';
import { MailService } from '../../../modules/mail/mail.service';

@Processor({ name: QueuePriority.P0 }, { concurrency: 10 })
export class P0Processor extends BasePriorityProcessor {
  constructor(mailService: MailService) {
    super(mailService);
  }
}

@Processor({ name: QueuePriority.P1 }, { concurrency: 5 })
export class P1Processor extends BasePriorityProcessor {
  constructor(mailService: MailService) {
    super(mailService);
  }
}

@Processor({ name: QueuePriority.P2 }, { concurrency: 5 })
export class P2Processor extends BasePriorityProcessor {
  constructor(mailService: MailService) {
    super(mailService);
  }
}

@Processor({ name: QueuePriority.P3 }, { concurrency: 5 })
export class P3Processor extends BasePriorityProcessor {
  constructor(mailService: MailService) {
    super(mailService);
  }
}

@Processor({ name: QueuePriority.P4 }, { concurrency: 3 })
export class P4Processor extends BasePriorityProcessor {
  constructor(mailService: MailService) {
    super(mailService);
  }
}

@Processor({ name: QueuePriority.P5 }, { concurrency: 3 })
export class P5Processor extends BasePriorityProcessor {
  constructor(mailService: MailService) {
    super(mailService);
  }
}

@Processor({ name: QueuePriority.P6 }, { concurrency: 2 })
export class P6Processor extends BasePriorityProcessor {
  constructor(mailService: MailService) {
    super(mailService);
  }
}

@Processor({ name: QueuePriority.P7 }, { concurrency: 2 })
export class P7Processor extends BasePriorityProcessor {
  constructor(mailService: MailService) {
    super(mailService);
  }
}

export const ALL_PRIORITY_PROCESSORS = [
  P0Processor,
  P1Processor,
  P2Processor,
  P3Processor,
  P4Processor,
  P5Processor,
  P6Processor,
  P7Processor,
];
