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
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    text,
    html,
  };

  try {
    const [response] = await sgMail.send(msg);
    return response;
  } catch (error: any) {
    // If a timeout error occurs, retry once before failing
    if (retries > 0 && error.code === 'ETIMEDOUT') {
      console.log('Email send timeout, retrying...', {
        to,
        subject,
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
    throw error;
  }
}

export { sendEmail, EmailParams };
