export enum QueuePriority {
  P0 = 'P0', // Critical — OTP, security-sensitive auth flows
  P1 = 'P1', // High — user-triggered time-sensitive tasks
  P2 = 'P2', // Above normal
  P3 = 'P3', // Normal — invites, standard notifications
  P4 = 'P4', // Below normal
  P5 = 'P5', // Low — bulk operations
  P6 = 'P6', // Background — reports, analytics
  P7 = 'P7', // Batch — long-running or deferred exports
}
