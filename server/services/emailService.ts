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
      },
      bypassListManagement: {
        enable: true
      },
      bypassSpamManagement: {
        enable: true
      }
    },
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true },
      subscriptionTracking: { enable: false },
      ganalytics: { enable: false }
    },
    headers: {
      'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      'X-Priority': '1',
      'Importance': 'high',
      'X-MSMail-Priority': 'High',
      'List-Unsubscribe': `<mailto:unsubscribe@${new URL(senderEmail).hostname}>`,
      'Feedback-ID': 'StackTracker:account-verification'
    },
    asm: {
      groupId: 0, // Disable unsubscribe groups for transactional emails
    },
    categories: ['account-verification']
  };

  console.log('Attempting to send email:', {
    to: msg.to,
    from: msg.from,
    subject: msg.subject,
    headers: msg.headers,
    timestamp: new Date().toISOString(),
    remainingRetries: retries
  });

  try {
    const [response] = await sgMail.send(msg);

    console.log('Email sent successfully:', {
      to: msg.to,
      statusCode: response.statusCode,
      messageId: response.headers['x-message-id'],
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error: any) {
    // If a timeout error occurs, retry once before failing
    if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET')) {
      console.log('Email send timeout, retrying...', {
        to,
        subject,
        error: {
          code: error.code,
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
      return await sendEmail({ to, subject, text, html }, retries - 1);
    }

    console.error('Email send error:', {
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

    throw error;
  }
}

export { sendEmail, EmailParams };