export enum QueuePriority {
  P0 = 'p0', // Critical — OTP, security-sensitive auth flows
  P1 = 'p1', // High — user-triggered time-sensitive tasks
  P2 = 'p2', // Above normal
  P3 = 'p3', // Normal — invites, standard notifications
  P4 = 'p4', // Below normal
  P5 = 'p5', // Low — bulk operations
  P6 = 'p6', // Background — reports, analytics
  P7 = 'p7', // Batch — long-running or deferred exports
}
