
import sgMail from '../config/sendgrid';
import { EMAIL_TEMPLATES } from '../config/sendgrid';
import logger from '../utils/logger';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sendEmail(msg: sgMail.MailDataRequired): Promise<void> {
  let attempt = 0;
  
  // Let SendGrid handle email authentication headers
  msg.headers = {
    ...msg.headers
  };

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

export async function sendWelcomeEmail(to: string, username: string): Promise<void> {
  const currentYear = new Date().getFullYear();
  
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    templateId: EMAIL_TEMPLATES.WELCOME,
    dynamicTemplateData: {
      firstName: username,
      setupAccountLink: `${process.env.APP_URL}/profile`,
      currentYear: currentYear.toString(),
      proPlanLink: '#' // Placeholder until pro plan page is created
    }
  };

  await sendEmail(msg);
}

export {
  sendEmail,
  EMAIL_TEMPLATES
};
