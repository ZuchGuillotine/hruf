
import sgMail from '@sendgrid/mail';

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

async function testSendEmail() {
  const msg = {
    to: 'bencox820@hotmail.com',
    from: 'accounts@stacktracker.io', // must be verified sender
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };

  try {
    await sgMail.send(msg);
    console.log('Test email sent successfully');
  } catch (error: any) {
    console.error('Error sending test email:');
    console.error(error.response ? error.response.body : error);
  }
}

// Run the test
testSendEmail();
