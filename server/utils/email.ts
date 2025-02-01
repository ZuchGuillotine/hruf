import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Verbose environment checking
const REQUIRED_ENV_VARS = {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL
};

export async function testSendGridConnection(): Promise<boolean> {
  try {
    // Check for required environment variables
    const missingVars = Object.entries(REQUIRED_ENV_VARS)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      return false;
    }

    // Set API key
    sgMail.setApiKey(REQUIRED_ENV_VARS.SENDGRID_API_KEY!);

    // Send a test email without sandbox mode
    const msg = {
      to: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
      from: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
      subject: 'SendGrid Test Email',
      text: 'This is a test email to verify SendGrid is working.',
      html: '<strong>This is a test email to verify SendGrid is working.</strong>'
    };

    const [response] = await sgMail.send(msg);

    console.log('Test email sent successfully:', {
      statusCode: response?.statusCode,
      headers: response?.headers,
      timestamp: new Date().toISOString()
    });

    return response?.statusCode === 202;
  } catch (error: any) {
    console.error('SendGrid test failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.body,
      stack: error.stack
    });
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  try {
    if (!email || !token) {
      console.error('Missing required parameters:', { email: !!email, token: !!token });
      return false;
    }

    console.log('Preparing to send verification email:', {
      to: email,
      from: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL,
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });

    // Set API key for this request
    sgMail.setApiKey(REQUIRED_ENV_VARS.SENDGRID_API_KEY!);

    const verificationUrl = `${REQUIRED_ENV_VARS.APP_URL}/verify-email?token=${token}`;
    console.log('Generated verification URL:', verificationUrl);

    const msg = {
      to: email,
      from: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
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
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    };

    console.log('Sending verification email with configuration:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      hasHtml: !!msg.html,
      hasText: !!msg.text,
      timestamp: new Date().toISOString()
    });

    const [response] = await sgMail.send(msg);

    console.log('SendGrid API Response:', {
      statusCode: response?.statusCode,
      headers: response?.headers,
      timestamp: new Date().toISOString()
    });

    return response?.statusCode === 202;
  } catch (error: any) {
    console.error('Failed to send verification email:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.body,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    if (error.response?.body?.errors) {
      console.error('SendGrid API Errors:', error.response.body.errors);
    }

    throw error;
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Test SendGrid connection on startup
testSendGridConnection()
  .then(success => {
    if (success) {
      console.log('✓ SendGrid test email sent successfully');
    } else {
      console.error('✗ SendGrid test email failed');
    }
  })
  .catch(console.error);