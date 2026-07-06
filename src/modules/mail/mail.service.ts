import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.password'),
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    const from = this.configService.get<string>('mail.from');
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Your Southlake Login Code',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #0d1b4b;">Southlake Insurance</h2>
            <p>Your one-time login code is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0d1b4b; margin: 24px 0;">
              ${otp}
            </div>
            <p>This code expires in 5 minutes. Do not share it with anyone.</p>
            <p style="color: #888; font-size: 12px;">If you did not request this code, please ignore this email.</p>
          </div>
        `,
      });
    } catch {
      this.logger.warn(
        `Failed to send OTP email to ${to} (mail not configured) — OTP was logged to console`,
      );
    }
  }

  async sendInvite(
    to: string,
    name: string,
    inviteLink: string,
    invitedByName: string,
  ): Promise<void> {
    const from = this.configService.get<string>('mail.from');
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `You have been invited to Southlake Insurance`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #0d1b4b;">Southlake Insurance</h2>
            <p>Hi ${name},</p>
            <p>${invitedByName} has invited you to join Southlake Insurance.</p>
            <p>Click the button below to accept your invitation. This link expires in 7 days.</p>
            <a href="${inviteLink}" style="
              display: inline-block;
              background: #0d1b4b;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              margin: 16px 0;
            ">Accept Invitation</a>
            <p style="color: #888; font-size: 12px;">
              If you did not expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch {
      this.logger.warn(`Failed to send invite email to ${to} (mail not configured)`);
    }
  }
}
