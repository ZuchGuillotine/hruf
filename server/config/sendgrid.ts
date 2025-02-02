import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';

// Detailed environment variable validation
function validateSendGridConfig() {
  const config = {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_SENDER_EMAIL: process.env.SENDGRID_SENDER_EMAIL,
  };

  console.log('SendGrid Configuration Check:', {
    apiKeyPresent: !!config.SENDGRID_API_KEY,
    senderEmailPresent: !!config.SENDGRID_SENDER_EMAIL,
    timestamp: new Date().toISOString()
  });

  if (!config.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not defined');
  }
  if (!config.SENDGRID_SENDER_EMAIL) {
    throw new Error('SENDGRID_SENDER_EMAIL is not defined');
  }

  // Validate sender email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.SENDGRID_SENDER_EMAIL)) {
    throw new Error('SENDGRID_SENDER_EMAIL is not a valid email address');
  }

  const senderDomain = config.SENDGRID_SENDER_EMAIL.split('@')[1];

  console.log('SendGrid Domain Validation:', {
    senderEmail: config.SENDGRID_SENDER_EMAIL,
    domain: senderDomain,
    timestamp: new Date().toISOString()
  });

  return { ...config, senderDomain };
}

// Initialize SendGrid with validation
const config = validateSendGridConfig();
sgMail.setApiKey(config.SENDGRID_API_KEY);

// Test SendGrid configuration with corrected settings
async function testSendGridConnection(): Promise<boolean> {
  try {
    console.log('Testing SendGrid with domain:', config.senderDomain);

    const msg: MailDataRequired = {
      to: config.SENDGRID_SENDER_EMAIL,
      from: {
        email: config.SENDGRID_SENDER_EMAIL,
        name: 'StackTracker Support'
      },
      subject: 'SendGrid Test',
      text: 'Testing SendGrid Configuration',
      html: '<p>Testing SendGrid Configuration</p>',
      mailSettings: {
        sandboxMode: {
          enable: false
        }
      },
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      },
      headers: {
        'X-Priority': '1',
        'Importance': 'high',
        'X-MSMail-Priority': 'High',
        'List-Unsubscribe': `<mailto:unsubscribe@${config.senderDomain}>`,
        'Feedback-ID': 'StackTracker:account-verification'
      },
      categories: ['test-email']
    };

    console.log('Testing SendGrid connection:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      headers: msg.headers,
      domain: config.senderDomain,
      timestamp: new Date().toISOString()
    });

    const [response] = await sgMail.send(msg);

    console.log('SendGrid test successful:', {
      statusCode: response.statusCode,
      headers: response.headers,
      messageId: response.headers['x-message-id'],
      timestamp: new Date().toISOString()
    });

    return response.statusCode === 202;
  } catch (error: any) {
    console.error('SendGrid test failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.body,
      timestamp: new Date().toISOString()
    });

    if (error.response?.body?.errors) {
      console.error('SendGrid API Errors:', {
        errors: error.response.body.errors,
        timestamp: new Date().toISOString()
      });
    }

    return false;
  }
}

// Test connection on startup
testSendGridConnection().catch(console.error);

export default sgMail;