import nodemailer from 'nodemailer';
import logger from '../utils/logger';

class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  public async send({
    to,
    subject,
    text,
    html,
  }: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }) {
    try {
      await this.transporter.verify();
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      logger.error('Failed to send email', error, {
        to,
        subject,
        text,
      });
      throw new Error('Failed to send email');
    }
  }
}

export default new EmailService();
