import sgMail from '@sendgrid/mail';

// Detailed environment variable validation
function validateSendGridConfig() {
  const config = {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_SENDER_EMAIL: process.env.SENDGRID_SENDER_EMAIL
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

  return config;
}

// Initialize SendGrid with validation
const config = validateSendGridConfig();
sgMail.setApiKey(config.SENDGRID_API_KEY);

// Test SendGrid configuration
async function testSendGridConnection(): Promise<boolean> {
  try {
    const msg = {
      to: config.SENDGRID_SENDER_EMAIL,
      from: config.SENDGRID_SENDER_EMAIL,
      subject: 'SendGrid Test',
      text: 'Testing SendGrid Configuration',
    };

    console.log('Testing SendGrid connection:', {
      to: msg.to,
      from: msg.from,
      timestamp: new Date().toISOString()
    });

    const [response] = await sgMail.send(msg);

    console.log('SendGrid test successful:', {
      statusCode: response.statusCode,
      headers: response.headers,
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
    return false;
  }
}

// Test connection on startup
testSendGridConnection().catch(console.error);

export default sgMail;