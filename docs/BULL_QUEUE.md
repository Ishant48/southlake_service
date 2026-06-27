# Bull Queue — Async Mail

## Overview

Email sending is handled asynchronously via a BullMQ queue backed by Redis. This prevents mail delivery latency from blocking HTTP response times and provides automatic retry on failure.

---

## Architecture

```
HTTP Request
    ↓
Service calls CommunicationService
    ↓
CommunicationService calls MailProducer
    ↓
MailProducer → BullMQ Queue (Redis) ← immediately returns
    ↓ (async, separate worker process/thread)
MailProcessor dequeues job
    ↓
MailService.sendOtp() or sendInvite() via Nodemailer
```

---

## Files

| File | Location | Purpose |
|------|----------|---------|
| `mail.types.ts` | `src/common/queues/mail/` | Queue name constant, job name enum, job data interfaces |
| `mail.producer.ts` | `src/common/queues/mail/` | Enqueues jobs with retry/backoff options |
| `mail.processor.ts` | `src/common/queues/mail/` | Worker that processes jobs and calls MailService |
| `mail-queue.module.ts` | `src/common/queues/mail/` | `BullModule` registration (forRootAsync + registerQueue) |
| `communication.service.ts` | `src/common/communication/` | Thin facade over MailProducer |
| `communication.module.ts` | `src/common/communication/` | Exports CommunicationService |

---

## Job Types

```typescript
export const MAIL_QUEUE = 'mail';

export enum MailJobName {
  SEND_OTP    = 'send_otp',
  SEND_INVITE = 'send_invite',
}

export interface SendOtpJobData {
  to: string;
  otp: string;
}

export interface SendInviteJobData {
  to: string;
  name: string;
  inviteLink: string;
  invitedByName: string;
}
```

---

## Producer Usage

```typescript
// Enqueue OTP email
await this.mailProducer.enqueueOtp(email, otp);

// Enqueue invite email
await this.mailProducer.enqueueInvite(email, name, inviteLink, invitedByName);
```

Both methods use:
- `attempts: 3`
- `backoff: { type: 'exponential', delay: 2000 }`

---

## CommunicationService

The `CommunicationService` is the intended injection point for modules. It wraps `MailProducer` and can be extended to support future channels (SMS, push, etc.) without changing callers.

```typescript
// In any module that sends comms:
constructor(private readonly communication: CommunicationService) {}

await this.communication.sendOtp(email, otp);
await this.communication.sendInvite(email, name, inviteLink, invitedByName);
```

---

## Redis Configuration

```
REDIS_HOST=localhost     # default: localhost
REDIS_PORT=6379          # default: 6379
REDIS_PASSWORD=          # optional
```

Config namespace: `redis` (via `src/config/redis.config.ts`).

The `BullModule.forRootAsync()` in `MailQueueModule` reads from `ConfigService.get('redis')`.

---

## Local Redis Setup

```bash
# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Homebrew (macOS)
brew install redis && brew services start redis
```

---

## Disabling the Queue (dev/test)

If Redis is not available in development, the queue will log connection errors but HTTP requests will not fail — BullMQ handles connection retries internally. For tests, the queue is typically not exercised (unit tests mock `CommunicationService`; e2e tests use relaxed `.env.test` settings).

---

## Related Documentation

- [Environment Configuration](./ENV_SETUP.md)
- [Auth Module](./AUTH_MODULE.md) — uses OTP queue
- [Users Module](./USERS_MODULE.md) — uses invite queue
