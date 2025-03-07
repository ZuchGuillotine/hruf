import sgMail from '@sendgrid/mail';
import logger from '../utils/logger';

// Default sender email
export const DEFAULT_SENDER = 'accounts@stacktracker.io';

// Email template IDs
export const EMAIL_TEMPLATES = {
  WELCOME: process.env.SENDGRID_WELCOME_TEMPLATE_ID,
  PASSWORD_RESET: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID,
  VERIFICATION: process.env.SENDGRID_VERIFICATION_TEMPLATE_ID
};

/**
 * Sends an email using SendGrid
 */
export async function sendEmail(msg: sgMail.MailDataRequired): Promise<boolean> {
  try {
    // Set API key if not already set
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key is not set');
      return false;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Ensure from address is set
    if (!msg.from) {
      msg.from = DEFAULT_SENDER;
    }

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    logger.error('SendGrid error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error && 'response' in error ? (error as any).response?.body : undefined
    });
    return false;
  }
}

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