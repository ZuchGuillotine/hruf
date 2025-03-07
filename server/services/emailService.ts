
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
import sgMail from '@sendgrid/mail';
import { EMAIL_TEMPLATES, DEFAULT_SENDER, sendEmail } from '../config/sendgrid';
import logger from '../utils/logger';

/**
 * Sends a welcome email after successful registration.
 */
export async function sendWelcomeEmail(to: string, username: string): Promise<boolean> {
  // Use template if available, otherwise use basic HTML
  if (EMAIL_TEMPLATES.WELCOME) {
    // Template-based email with dynamic data
    const msg = {
      to,
      from: DEFAULT_SENDER,
      templateId: EMAIL_TEMPLATES.WELCOME,
      dynamicTemplateData: {
        username: username,
        currentYear: new Date().getFullYear()
      },
    };
    
    try {
      await sendEmail(msg);
      console.log(`Welcome email sent to ${to} using template`);
      return true;
    } catch (error) {
      console.error(`Failed to send welcome email to ${to}:`, error);
      return false;
    }
  } else {
    // Fallback to basic email if template ID not set
    const msg = {
      to,
      from: DEFAULT_SENDER,
      subject: 'Welcome to Stack Tracker!',
      html: `
        <h1>Welcome to Stack Tracker, ${username}!</h1>
        <p>Thank you for joining our community. Here's what you can do next:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Add your supplements</li>
          <li>Track your health metrics</li>
          <li>Set up reminders</li>
        </ul>
        <p>If you have any questions, our support team is here to help!</p>
      `,
    };

    try {
      await sendEmail(msg);
      console.log(`Welcome email sent to ${to} using basic template`);
      return true;
    } catch (error) {
      console.error(`Failed to send welcome email to ${to}:`, error);
      return false;
    }
  }
}

/**
 * Sends a password reset email with token link
 */
export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const resetLink = `https://stacktracker.io/reset-password?token=${resetToken}`;
  
  const msg = {
    to,
    from: DEFAULT_SENDER,
    subject: 'Reset Your Stack Tracker Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Stack Tracker account.</p>
      <p>Please click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="padding: 10px 20px; background-color: #1b4332; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email or contact support if you have concerns.</p>
    `,
  };
  
  return sendEmail(msg);
}
