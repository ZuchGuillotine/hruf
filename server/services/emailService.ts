import sgMail from '../config/sendgrid';
import { EMAIL_TEMPLATES, sendTemplateEmail } from '../config/sendgrid';
import logger from '../utils/logger';

export async function sendWelcomeEmail(to: string, username: string): Promise<boolean> {
  return sendTemplateEmail(to, EMAIL_TEMPLATES.WELCOME, {
    username,
    loginUrl: `${process.env.APP_URL}/login`
  });
}

export {
  sendTemplateEmail,
  EMAIL_TEMPLATES
};