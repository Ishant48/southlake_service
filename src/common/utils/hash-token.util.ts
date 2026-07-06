import * as crypto from 'crypto';

/** One-way hash for storing bearer/session tokens at rest so a DB leak doesn't yield usable credentials. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
