import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import { MailDataRequired } from '@sendgrid/mail';
import axios from 'axios';

// Verbose environment checking
const REQUIRED_ENV_VARS = {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_TEMPLATE_ID: process.env.SENDGRID_TEMPLATE_ID,
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL
};

// Configure SendGrid
const configureSendGrid = () => {
  if (!REQUIRED_ENV_VARS.SENDGRID_API_KEY) {
    throw new Error('SendGrid API key is required');
  }
  sgMail.setApiKey(REQUIRED_ENV_VARS.SENDGRID_API_KEY);
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

    // Configure SendGrid
    configureSendGrid();

    // Simple test email without template
    const msg: MailDataRequired = {
      to: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
      from: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
      subject: 'SendGrid Test Email',
      text: 'This is a test email to verify SendGrid connectivity.',
      html: '<p>This is a test email to verify SendGrid connectivity.</p>'
    };

    console.log('Sending test email:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      timestamp: new Date().toISOString()
    });

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
      networkError: error.isAxiosError ? {
        timeout: error.code === 'ECONNABORTED',
        message: error.message
      } : undefined,
      timestamp: new Date().toISOString()
    });

    if (error.response?.body?.errors) {
      console.error('SendGrid API Errors:', error.response.body.errors);
    }

    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  try {
    if (!email || !token) {
      console.error('Missing required parameters:', { email: !!email, token: !!token });
      return false;
    }

    configureSendGrid();

    const verificationUrl = `${REQUIRED_ENV_VARS.APP_URL}/verify-email?token=${token}`;

    // Log the complete request configuration
    console.log('Verification email configuration:', {
      apiEndpoint: 'https://api.sendgrid.com/v3/mail/send',
      apiKey: 'present',
      fromEmail: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL,
      toEmail: email,
      appUrl: REQUIRED_ENV_VARS.APP_URL,
      timestamp: new Date().toISOString()
    });

    const msg: MailDataRequired = {
      to: email,
      from: {
        email: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
        name: 'StackTracker'
      },
      subject: 'Verify your StackTracker account',
      text: `Please verify your email to complete registration. Click here: ${verificationUrl}`,
      html: `
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
        </div>
      `.trim(),
      headers: {
        'X-Priority': '1',
        'X-Application': 'StackTracker'
      },
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    };

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    while (retryCount < maxRetries) {
      try {
        console.log('Sending verification email (attempt ' + (retryCount + 1) + '):', {
          to: msg.to,
          from: msg.from,
          endpoint: 'https://api.sendgrid.com/v3/mail/send',
          timestamp: new Date().toISOString()
        });

        const [response] = await sgMail.send(msg);

        console.log('Verification email sent successfully:', {
          statusCode: response?.statusCode,
          headers: response?.headers,
          timestamp: new Date().toISOString()
        });

        return response?.statusCode === 202;
      } catch (retryError: any) {
        retryCount++;

        console.error(`Retry ${retryCount}/${maxRetries} failed:`, {
          name: retryError.name,
          message: retryError.message,
          code: retryError.code,
          response: retryError.response?.body,
          timestamp: new Date().toISOString()
        });

        if (retryCount === maxRetries) throw retryError;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return false;
  } catch (error: any) {
    console.error('Failed to send verification email:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.body,
      timestamp: new Date().toISOString()
    });

    if (error.response?.body?.errors) {
      console.error('SendGrid API Errors:', error.response.body.errors);
    }

    return false;
  }
}


export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendVerificationTestEmail(): Promise<boolean> {
  const testEmail = 'test@example.com';
  const testToken = generateVerificationToken();

  console.log('Attempting to send verification test email to:', testEmail);
  return sendVerificationEmail(testEmail, testToken);
}

// Initialize SendGrid configuration
configureSendGrid();

// Test SendGrid connection on startup with a delay to ensure proper initialization
setTimeout(() => {
  testSendGridConnection()
    .then(success => {
      if (success) {
        console.log('✓ SendGrid test email sent successfully');
        // After successful test email, try verification email
        return sendVerificationTestEmail();
      } else {
        console.error('✗ SendGrid test email failed');
      }
    })
    .then(verificationSuccess => {
      if (verificationSuccess) {
        console.log('✓ SendGrid verification test email sent successfully');
      } else {
        console.error('✗ SendGrid verification test email failed');
      }
    })
    .catch(console.error);
}, 1000);