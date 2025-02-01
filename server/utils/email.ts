import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Verbose environment checking
const REQUIRED_ENV_VARS = {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL
};

async function initializeSendGrid() {
  try {
    // Check for required environment variables
    const missingVars = Object.entries(REQUIRED_ENV_VARS)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Initialize SendGrid with API key
    if (!REQUIRED_ENV_VARS.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key is required');
    }

    sgMail.setApiKey(REQUIRED_ENV_VARS.SENDGRID_API_KEY);

    // Test API key validity with a simple API call
    await sgMail.send({
      to: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL,
      from: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL,
      subject: 'SendGrid Test',
      text: 'This is a test email to verify SendGrid configuration.',
      mail_settings: {
        sandbox_mode: {
          enable: true // This prevents the actual email from being sent
        }
      }
    });

    console.log('✓ SendGrid initialized successfully');
    return true;
  } catch (error: any) {
    console.error('SendGrid initialization failed:', {
      error: error.message,
      code: error.code,
      response: error.response?.body,
    });
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  try {
    // Validate inputs
    if (!email || !token) {
      throw new Error('Email and token are required');
    }

    // Log attempt details
    console.log('Attempting to send verification email:', {
      to: email,
      from: REQUIRED_ENV_VARS.SENDGRID_FROM_EMAIL,
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });

    const verificationUrl = `${REQUIRED_ENV_VARS.APP_URL}/verify-email?token=${token}`;

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
        clickTracking: {
          enable: true
        },
        openTracking: {
          enable: true
        }
      }
    };

    // Initialize SendGrid if not already done
    await initializeSendGrid();

    // Send email and get response
    const [response] = await sgMail.send(msg);

    // Log success details
    console.log('SendGrid API Response:', {
      statusCode: response?.statusCode,
      headers: response?.headers,
      body: response?.body
    });

    if (response?.statusCode === 202) {
      console.log('✓ Verification email sent successfully');
      return true;
    }

    throw new Error(`Unexpected status code: ${response?.statusCode}`);
  } catch (error: any) {
    // Enhanced error logging
    console.error('SendGrid Error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.body,
      stack: error.stack
    });

    // Handle specific SendGrid errors
    if (error.response?.body) {
      const { errors } = error.response.body;
      const errorMessage = errors?.[0]?.message || error.message;

      if (errorMessage.includes('The from address does not match')) {
        throw new Error('Sender email is not verified in SendGrid');
      }
      if (errorMessage.includes('API key does not have permission')) {
        throw new Error('SendGrid API key missing required permissions');
      }
      if (errorMessage.includes('domain authentication')) {
        throw new Error('Domain authentication required in SendGrid');
      }
    }

    throw error;
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Initialize SendGrid when the module loads
initializeSendGrid().catch(console.error);