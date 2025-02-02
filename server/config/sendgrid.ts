
import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';

// Load and validate configuration
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

if (!apiKey) {
  throw new Error('SENDGRID_API_KEY is not defined in environment variables.');
}

if (!fromEmail) {
  throw new Error('SENDGRID_FROM_EMAIL is not defined in environment variables.');
}

console.log('SendGrid Configuration:', {
  apiKeyExists: !!apiKey,
  fromEmail,
  templateIds: EMAIL_TEMPLATES
});

// Set the API key for SendGrid
sgMail.setApiKey(apiKey);

// Email template IDs
export const EMAIL_TEMPLATES = {
  WELCOME: 'd-xxxxxxxxxxxxx', // Replace with actual template ID
  TWO_FACTOR: 'd-xxxxxxxxxxxxx',
  PASSWORD_RESET: 'd-xxxxxxxxxxxxx',
  DRIP_1: 'd-xxxxxxxxxxxxx',
  DRIP_2: 'd-xxxxxxxxxxxxx',
  DRIP_3: 'd-xxxxxxxxxxxxx',
} as const;

// Sender configuration
export const DEFAULT_SENDER = {
  email: 'noreply@yourdomain.com',
  name: 'Stack Tracker',
};

// Email sending wrapper with error handling and logging
export async function sendEmail(data: MailDataRequired): Promise<boolean> {
  try {
    await sgMail.send(data);
    console.log(`Email sent successfully to ${data.to}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid error:', error?.response?.body || error);
    return false;
  }
}

// Helper for sending template-based emails
export async function sendTemplateEmail(
  to: string,
  templateId: string,
  dynamicData: Record<string, any>
): Promise<boolean> {
  const msg: MailDataRequired = {
    to,
    from: DEFAULT_SENDER,
    templateId,
    dynamicTemplateData: dynamicData,
  };
  return sendEmail(msg);
}

// Two-factor authentication email
export async function send2FAEmail(
  to: string,
  code: string,
  expiresIn: string
): Promise<boolean> {
  return sendTemplateEmail(to, EMAIL_TEMPLATES.TWO_FACTOR, {
    code,
    expiresIn,
    timestamp: new Date().toISOString(),
  });
}

// Welcome email
export async function sendWelcomeEmail(
  to: string,
  username: string
): Promise<boolean> {
  return sendTemplateEmail(to, EMAIL_TEMPLATES.WELCOME, {
    username,
    loginUrl: 'https://stacktracker.com/login',
  });
}

export default sgMail;
