import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  appUrl: process.env.APP_URL || 'http://localhost:4200',
  sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS, 10) || 24,
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5,
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
}));
