export enum PriorityJobName {
  SEND_OTP = 'send_otp',
  SEND_INVITE = 'send_invite',
}

export interface SendOtpPayload {
  to: string;
  otp: string;
}

export interface SendInvitePayload {
  to: string;
  name: string;
  inviteLink: string;
  invitedByName: string;
}

export type PriorityJobPayload = SendOtpPayload | SendInvitePayload;
