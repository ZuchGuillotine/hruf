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
  const msg: MailDataRequired = {
    to,
    from: process.env.SENDGRID_SENDER_EMAIL!,
    subject,
    text,
    html,
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    }
  };

  console.log('Attempting to send email:', {
    to: msg.to,
    from: msg.from,
    subject: msg.subject,
    timestamp: new Date().toISOString(),
    remainingRetries: retries
  });

  try {
    const [response] = await sgMail.send(msg);

    console.log('Email sent successfully:', {
      to: msg.to,
      statusCode: response.statusCode,
      headers: response.headers,
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