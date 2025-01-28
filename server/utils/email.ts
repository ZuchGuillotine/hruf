import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Test SendGrid connection and sender verification
export async function testSendGridConnection() {
  try {
    const msg = {
      to: 'test@example.com', // This won't actually send an email
      from: 'accounts@stacktracker.io',
      subject: 'SendGrid Test',
      text: 'Testing SendGrid Configuration',
    };

    // This validates the API key and sender authentication
    await sgMail.send(msg);
    return true;
  } catch (error: any) {
    if (error.response) {
      const { message, code } = error.response.body;
      if (code === 403) {
        throw new Error('SendGrid API key does not have permission to send emails');
      }
      if (message.includes('The from address does not match')) {
        throw new Error('Sender email address not verified in SendGrid');
      }
    }
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;

  const msg = {
    to: email,
    from: 'accounts@stacktracker.io', // Verified SendGrid sender
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
    // Test connection before attempting to send
    await testSendGridConnection();

    // Send the actual email
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    if (error.response) {
      console.error('SendGrid API Error:', error.response.body);
    }
    throw new Error(error.message || 'Failed to send verification email');
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}