import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Thin mail wrapper. If no SMTP settings are present the message is logged
 * instead of sent — good enough for the testing phase, no provider required.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransport(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    const url = this.config.get<string>('SMTP_URL');
    const host = this.config.get<string>('SMTP_HOST');
    if (url) {
      this.transporter = nodemailer.createTransport(url);
    } else if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT') ?? 587,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
    return this.transporter;
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    const transport = this.getTransport();
    const from = this.config.get<string>('MAIL_FROM');

    if (!transport) {
      this.logger.warn(
        `SMTP not configured — email to ${to} not sent.\nSubject: ${subject}\n${text}`,
      );
      return;
    }

    try {
      await transport.sendMail({ from, to, subject, text });
      this.logger.debug(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
