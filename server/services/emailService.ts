import * as sgMail from '@sendgrid/mail';
import logger from '../utils/logger';
import { DEFAULT_SENDER } from '../config/sendgrid';

// Set API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Email data interface
 */

/**
 * Sends an email using SendGrid
 * @param emailData The email data to send
 * @returns true if email was sent successfully, false otherwise
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Validate email data
    if (!emailData.to) {
      logger.warn('Email not sent: recipient email is required');
      return false;
    }

    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      logger.warn('Email not sent: SendGrid API key not configured');
      return false;
    }

    // Check if we have text or html content
    if (!emailData.text && !emailData.html) {
      logger.warn('Email not sent: either text or html content is required');
      return false;
    }

    // Prepare email message
    const msg = {
      to: emailData.to,
      from: DEFAULT_SENDER.email,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      templateId: emailData.templateId,
      dynamicTemplateData: emailData.dynamicTemplateData
    };

    // Send email
    const [response] = await sgMail.send(msg);

    if (response.statusCode !== 202) {
      logger.error(`Failed to send email: ${response.statusCode}`);
      return false;
    } else {
      logger.info(`Email sent successfully to ${emailData.to}`);
      return true;
    }

    logger.info(`Email sent successfully to ${emailData.to}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
}
interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

/**
 * Sends a welcome email to a new user
 * @param email The user's email address
 * @param username The user's username
 * @returns true if email was sent successfully, false otherwise
 */
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Welcome to Stack Tracker',
    text: `Hello ${username}, welcome to Stack Tracker! Thank you for joining our platform.`,
    html: `<p>Hello ${username},</p><p>Welcome to Stack Tracker! Thank you for joining our platform.</p>`
  });
}
interface EmailData {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

/**
 * Sends an email using SendGrid
 * 
 * @param emailData Email configuration
 * @returns Promise resolving to boolean indicating success
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
    if (!process.env.SENDGRID_API_KEY) {
      logger.warn('Email not sent: SendGrid API key not configured');
      return false;
    }

    // Prepare email message
    const msg = {
      to: emailData.to,
      from: DEFAULT_SENDER.email,
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