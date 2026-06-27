export const MAIL_QUEUE = 'mail';

export enum MailJobName {
  SEND_OTP = 'send_otp',
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

export type MailJobData = SendOtpJobData | SendInviteJobData;
