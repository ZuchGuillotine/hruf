import * as sgMail from '@sendgrid/mail';
import logger from '../utils/logger';

// Set API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email templates/configuration
export const SENDGRID_CONFIG = {
  apiKeyExists: !!process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'accounts@stacktracker.io',
  templateIds: {
    WELCOME: process.env.SENDGRID_WELCOME_TEMPLATE || 'd-fe1c448989a34f4697885de8d504b960',
    TWO_FACTOR: process.env.SENDGRID_2FA_TEMPLATE || 'd-xxxxxxxxxxxxx',
    PASSWORD_RESET: process.env.SENDGRID_RESET_TEMPLATE || 'd-xxxxxxxxxxxxx',
    DRIP_1: process.env.SENDGRID_DRIP1_TEMPLATE || 'd-xxxxxxxxxxxxx',
    DRIP_2: process.env.SENDGRID_DRIP2_TEMPLATE || 'd-xxxxxxxxxxxxx',
    WEEKLY_SUMMARY: process.env.SENDGRID_WEEKLY_SUMMARY_TEMPLATE || 'd-xxxxxxxxxxxxx'
  }
};

/**
 * Email data interface
 */
interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

/**
 * Send an email using SendGrid
 * @param {EmailData} emailData - Email data including recipient, subject, content
 * @returns {Promise<boolean>} - Success status
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Validate required fields
    if (!emailData.to) {
      logger.error('Email sending failed: No recipient specified');
      return false;
    }

    if (!emailData.subject && !emailData.templateId) {
      logger.error('Email sending failed: No subject or templateId specified');
      return false;
    }

    // Check if SendGrid API key is configured
    if (!SENDGRID_CONFIG.apiKeyExists) {
      logger.warn('Email not sent: SendGrid API key not configured');
      return false;
    }

    // Prepare email message
    const msg = {
      to: emailData.to,
      from: SENDGRID_CONFIG.fromEmail,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      templateId: emailData.templateId,
      dynamicTemplateData: emailData.dynamicTemplateData
    };

    // Send email
    const response = await sgMail.send(msg);

    if (response && response[0].statusCode >= 200 && response[0].statusCode < 300) {
      logger.info(`Email sent successfully to ${emailData.to}`);
      return true;
    } else {
      logger.error('Email sending failed', { 
        response: response[0],
        recipient: emailData.to
      });
      return false;
    }
  } catch (error) {
    logger.error('Error sending email:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recipient: emailData.to
    });
    throw error;
  }
}

export { SENDGRID_CONFIG };