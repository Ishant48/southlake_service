export interface OtpPayload {
  to: string;
  otp: string;
}

export interface InvitePayload {
  to: string;
  name: string;
  inviteLink: string;
  invitedByName: string;
}
