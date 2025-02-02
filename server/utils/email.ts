import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import { MailDataRequired } from '@sendgrid/mail';

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
    const templateText = `Please verify your email to complete registration. Click here: ${verificationUrl}`;
    const templateHtml = `
      <p>Please verify your email to complete registration.</p>
      <p><a href="${verificationUrl}">Click here to verify your email</a></p>
    `;

    const msg: MailDataRequired = {
      to: email,
      from: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
      subject: 'Verify your StackTracker account',
      text: templateText,
      html: templateHtml,
      templateId: REQUIRED_ENV_VARS.SENDGRID_TEMPLATE_ID,
      dynamicTemplateData: {
        subject: 'Verify your StackTracker account',
        preheader: 'Please verify your email to complete registration',
        name: email.split('@')[0],
        verificationUrl: verificationUrl
      }
    };

    console.log('Sending verification email:', {
      to: msg.to,
      from: msg.from,
      templateId: msg.templateId,
      timestamp: new Date().toISOString()
    });

    const [response] = await sgMail.send(msg);

    console.log('Verification email sent successfully:', {
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