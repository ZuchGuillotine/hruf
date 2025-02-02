// This file is deprecated and has been replaced by:
// - server/config/sendgrid.ts
// - server/services/emailService.ts
// - server/controllers/authController.ts
import { sendEmail } from '../services/emailService';

// Re-export the new email service for backward compatibility
export { sendEmail };

// Maintaining the verification email functionality until it's migrated
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  try {
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const isDevEnvironment = appUrl.includes('localhost');
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;

    console.log('Generating verification email:', {
      email,
      verificationUrl,
      environment: isDevEnvironment ? 'development' : 'production',
      timestamp: new Date().toISOString()
    });

    const subject = 'Verify your StackTracker account';
    const text = `Please verify your email to complete registration. Click here: ${verificationUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to StackTracker!</h2>
        <p>Please verify your email to complete your registration.</p>
        <p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">
            Verify Email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${verificationUrl}
        </p>
        <p style="font-size: 12px; color: #888; margin-top: 24px;">
          This verification link will expire in 24 hours.
          If you did not create an account, please ignore this email.
        </p>
      </div>
    `.trim();

    const response = await sendEmail({ to: email, subject, text, html });
    return response.statusCode === 202;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

export function generateVerificationToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}