import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Allow override of sender email for testing
const SENDER_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'accounts@stacktracker.io';

export async function sendVerificationEmail(email: string, token: string) {
  // Get current environment URL
  const baseUrl = process.env.APP_URL || 'http://localhost:5000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  console.log('Email Configuration:', {
    environment: process.env.NODE_ENV || 'development',
    baseUrl,
    senderEmail: SENDER_EMAIL,
    recipientEmail: email,
    apiKeyPresent: !!process.env.SENDGRID_API_KEY,
  });

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
    console.log('Attempting to send verification email...');
    const [response] = await sgMail.send(msg);

    console.log('SendGrid Response:', {
      statusCode: response?.statusCode,
      headers: response?.headers,
    });

    return true;
  } catch (error: any) {
    console.error('SendGrid Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.body,
      code: error.code,
    });

    // Check for specific SendGrid errors
    if (error.response?.body) {
      const { errors } = error.response.body;
      if (errors?.[0]?.message.includes('domain')) {
        console.error('Domain verification error detected. Please ensure the sender domain is properly verified in SendGrid.');
      }
      if (errors?.[0]?.message.includes('permission')) {
        console.error('API key permission error. Please ensure the API key has "Mail Send" permissions.');
      }
    }

    throw error;
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}