import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;

  const msg = {
    to: email,
    from: 'noreply@stacktracker.co', // Replace with your verified sender
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
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    // Log more detailed error information
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error('Failed to send verification email');
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}