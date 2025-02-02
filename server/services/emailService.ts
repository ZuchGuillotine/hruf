
import sgMail from '../config/sendgrid';
import { EMAIL_TEMPLATES, DEFAULT_SENDER } from '../config/sendgrid';
import logger from '../utils/logger';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface EmailOptions {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

/**
 * Sends an email using SendGrid with retry logic.
 */
async function sendEmail(msg: sgMail.MailDataRequired): Promise<void> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await sgMail.send(msg);
      logger.info(`Email sent successfully to ${msg.to}`);
      return;
    } catch (error: any) {
      attempt++;
      const errorMessage = error?.message || 'Unknown error';
      logger.error(
        `Error sending email (attempt ${attempt}): ${errorMessage}`
      );

      if (error.response?.body) {
        logger.error(`SendGrid response: ${JSON.stringify(error.response.body)}`);
      }

      if (attempt >= MAX_RETRIES) {
        throw new Error(`Failed to send email after ${MAX_RETRIES} attempts: ${errorMessage}`);
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

/**
 * Sends a verification email to a user
 */
async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const msg: sgMail.MailDataRequired = {
    to,
    from: DEFAULT_SENDER,
    templateId: EMAIL_TEMPLATES.WELCOME,
    dynamicTemplateData: {
      verificationUrl: `${process.env.APP_URL}/verify-email?token=${token}`,
      expiresIn: '24 hours'
    }
  };
  await sendEmail(msg);
}

/**
 * Sends a password reset email
 */
async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const msg: sgMail.MailDataRequired = {
    to,
    from: DEFAULT_SENDER,
    templateId: EMAIL_TEMPLATES.PASSWORD_RESET,
    dynamicTemplateData: {
      resetUrl: `${process.env.APP_URL}/reset-password?token=${token}`,
      expiresIn: '1 hour'
    }
  };
  await sendEmail(msg);
}

/**
 * Sends a drip campaign email
 */
async function sendDripEmail(to: string, dripNumber: number, userData: Record<string, any>): Promise<void> {
  const templateMap = {
    1: EMAIL_TEMPLATES.DRIP_1,
    2: EMAIL_TEMPLATES.DRIP_2,
    3: EMAIL_TEMPLATES.DRIP_3
  };

  const templateId = templateMap[dripNumber as keyof typeof templateMap];
  if (!templateId) {
    throw new Error(`Invalid drip number: ${dripNumber}`);
  }

  const msg: sgMail.MailDataRequired = {
    to,
    from: DEFAULT_SENDER,
    templateId,
    dynamicTemplateData: {
      ...userData,
      unsubscribeUrl: `${process.env.APP_URL}/unsubscribe`
    }
  };
  await sendEmail(msg);
}

/**
 * Sends a 2FA code email
 */
async function send2FACodeEmail(to: string, code: string): Promise<void> {
  const msg: sgMail.MailDataRequired = {
    to,
    from: DEFAULT_SENDER,
    templateId: EMAIL_TEMPLATES.TWO_FACTOR,
    dynamicTemplateData: {
      code,
      expiresIn: '5 minutes'
    }
  };
  await sendEmail(msg);
}

export {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDripEmail,
  send2FACodeEmail
};
