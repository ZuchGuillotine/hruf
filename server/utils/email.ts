import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Verbose environment checking
const REQUIRED_ENV_VARS = {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_TEMPLATE_ID: process.env.SENDGRID_TEMPLATE_ID,
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

    // Send a test email using the template
    const msg = {
      to: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
      from: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
      templateId: REQUIRED_ENV_VARS.SENDGRID_TEMPLATE_ID!,
      dynamicTemplateData: {
        subject: 'SendGrid Test Email',
        preheader: 'Testing SendGrid Configuration',
        name: 'Test User',
        verificationUrl: `${REQUIRED_ENV_VARS.APP_URL}/verify-email?token=test`
      }
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

    // Use SendGrid template
    const msg = {
      to: email,
      from: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL!,
      templateId: REQUIRED_ENV_VARS.SENDGRID_TEMPLATE_ID!,
      dynamicTemplateData: {
        subject: 'Verify your StackTracker account',
        preheader: 'Please verify your email to complete registration',
        name: email.split('@')[0], // Use the part before @ as the name
        verificationUrl: verificationUrl
      }
    };

    console.log('Sending verification email with template:', {
      to: msg.to,
      from: msg.from,
      templateId: msg.templateId,
      dynamicTemplateData: msg.dynamicTemplateData,
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