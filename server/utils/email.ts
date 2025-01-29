import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const SENDER_EMAIL = 'accounts@stacktracker.io';

// Test SendGrid connection and sender verification
export async function testSendGridConnection() {
  try {
    console.log('Testing SendGrid configuration...');

    // First verify API key validity
    const msg = {
      to: 'test@example.com',
      from: SENDER_EMAIL,
      subject: 'SendGrid Test',
      text: 'Testing SendGrid Configuration',
    };

    try {
      await sgMail.send(msg);
      console.log('SendGrid API key is valid and has proper permissions');
    } catch (error: any) {
      console.error('SendGrid API Error:', {
        message: error.message,
        response: error.response?.body,
      });

      if (error.response?.body) {
        const { message, code } = error.response.body;
        if (code === 403) {
          throw new Error('SendGrid API key does not have proper permissions. Please ensure the API key has "Mail Send" permissions enabled.');
        }
        if (message.includes('The from address does not match')) {
          throw new Error(`Sender email "${SENDER_EMAIL}" is not verified in SendGrid. Please verify this domain or email address in your SendGrid account.`);
        }
        throw new Error(`SendGrid Error: ${message}`);
      }
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error('SendGrid Configuration Error:', error);
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;

  const msg = {
    to: email,
    from: SENDER_EMAIL,
    subject: 'Verify your StackTracker account',
    text: `Please verify your email address by clicking this link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1b4332;">Welcome to StackTracker!</h2>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; background-color: #1b4332; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 4px; 
                  margin: 20px 0;">
          Verify Email
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This verification link will expire in 24 hours.</p>
      </div>
    `,
  };

  try {
    console.log(`Attempting to send verification email to ${email}...`);
    await testSendGridConnection();

    // Send the actual email
    await sgMail.send(msg);
    console.log(`✓ Verification email successfully sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('Failed to send verification email:', {
      error: error.message,
      response: error.response?.body,
      email: email,
    });

    // Specific error handling for common issues
    if (error.response?.body) {
      const { message } = error.response.body;
      if (message.includes('The from address does not match')) {
        throw new Error(`Sender email "${SENDER_EMAIL}" is not verified in SendGrid`);
      }
      if (message.includes('rate limit')) {
        throw new Error('Email sending rate limit exceeded');
      }
      throw new Error(`SendGrid Error: ${message}`);
    }

    throw error;
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}