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
  const isDevEnvironment = appUrl.includes('localhost');

  // For production, use the authenticated SendGrid domain for sending
  // but keep the user-facing domain for links
  const senderDomain = isDevEnvironment ? 'localhost:5000' : 'em5459.stacktracker.io';
  const linkDomain = isDevEnvironment ? 'localhost:5000' : 'stacktracker.io';

  console.log('Email environment configuration:', {
    appUrl,
    senderDomain,
    linkDomain,
    environment: isDevEnvironment ? 'development' : 'production',
    timestamp: new Date().toISOString()
  });

  // Replace any URLs in the HTML content to use the correct domain
  const updatedHtml = isDevEnvironment ? html : html.replace(
    new RegExp(appUrl, 'g'),
    `https://${linkDomain}`
  );

  const msg: MailDataRequired = {
    to,
    from: {
      email: `noreply@${senderDomain}`,
      name: 'StackTracker Support'
    },
    subject,
    text,
    html: updatedHtml,
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