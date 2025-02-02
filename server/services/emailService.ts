import sgMail from '../config/sendgrid';
import { MailDataRequired } from '@sendgrid/mail';

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendEmail(
  { to, subject, text, html }: EmailParams, 
  retries = 1
): Promise<sgMail.ClientResponse> {
  const senderEmail = process.env.SENDGRID_SENDER_EMAIL;
  if (!senderEmail) {
    throw new Error('SENDGRID_SENDER_EMAIL environment variable is not set');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const senderDomain = senderEmail.split('@')[1];
  const isDevEnvironment = appUrl.includes('localhost');

  console.log('Email environment configuration:', {
    appUrl,
    senderDomain,
    environment: isDevEnvironment ? 'development' : 'production',
    timestamp: new Date().toISOString()
  });

  // In development, we'll still send emails but log warnings about domain mismatch
  if (isDevEnvironment && !senderDomain.includes('localhost')) {
    console.warn('Warning: Using production sender domain in development environment');
  }

  const msg: MailDataRequired = {
    to,
    from: {
      email: senderEmail,
      name: 'StackTracker Support'
    },
    subject,
    text,
    html,
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
      'List-Unsubscribe': `<mailto:unsubscribe@${senderDomain}>`,
      'Feedback-ID': 'StackTracker:account-verification'
    },
    categories: ['account-verification']
  };

  console.log('Attempting to send email:', {
    to: msg.to,
    from: msg.from,
    subject: msg.subject,
    headers: msg.headers,
    environment: isDevEnvironment ? 'development' : 'production',
    timestamp: new Date().toISOString(),
    remainingRetries: retries
  });

  try {
    const [response] = await sgMail.send(msg);

    console.log('Email sent successfully:', {
      to: msg.to,
      statusCode: response.statusCode,
      messageId: response.headers['x-message-id'],
      environment: isDevEnvironment ? 'development' : 'production',
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error: any) {
    // Retry on network-related errors
    if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET')) {
      console.log('Email send timeout, retrying...', {
        to,
        subject,
        error: {
          code: error.code,
          message: error.message
        },
        environment: isDevEnvironment ? 'development' : 'production',
        timestamp: new Date().toISOString()
      });
      return await sendEmail({ to, subject, text, html }, retries - 1);
    }

    console.error('Email send error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.body,
      environment: isDevEnvironment ? 'development' : 'production',
      timestamp: new Date().toISOString()
    });

    // Log specific SendGrid API errors
    if (error.response?.body?.errors) {
      console.error('SendGrid API Errors:', {
        errors: error.response.body.errors,
        environment: isDevEnvironment ? 'development' : 'production',
        timestamp: new Date().toISOString()
      });
    }

    throw error;
  }
}

export { sendEmail, EmailParams };