import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not defined');
}
if (!process.env.SENDGRID_FROM_EMAIL) {
  throw new Error('SENDGRID_FROM_EMAIL is not defined');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default sgMail;
