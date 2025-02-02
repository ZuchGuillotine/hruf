import { Request, Response, NextFunction } from 'express';
import { sendEmail } from '../services/emailService';

async function sendTwoFactorAuthEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, code } = req.body;

    console.log('2FA Request received:', {
      emailProvided: !!email,
      codeProvided: !!code,
      timestamp: new Date().toISOString()
    });

    if (!email || !code) {
      console.warn('Missing 2FA fields:', {
        email: !email ? 'missing' : 'present',
        code: !code ? 'missing' : 'present',
        timestamp: new Date().toISOString()
      });

      res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          email: !email ? 'Email is required' : undefined,
          code: !code ? 'Code is required' : undefined
        }
      });
      return;
    }

    const subject = 'Your 2FA Code';
    const text = `Your two-factor authentication code is: ${code}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Two-Factor Authentication Code</h2>
        <p>Your two-factor authentication code is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #4F46E5; padding: 12px; background: #F3F4F6; border-radius: 4px; text-align: center;">
          ${code}
        </p>
        <p style="color: #666; font-size: 14px;">
          This code will expire in 10 minutes.<br>
          If you did not request this code, please ignore this email.
        </p>
        <p style="font-size: 12px; color: #888; margin-top: 24px;">
          This is an automated message, please do not reply.
        </p>
      </div>
    `.trim();

    console.log('Sending 2FA email:', {
      to: email,
      subject,
      messageType: '2FA Code',
      timestamp: new Date().toISOString()
    });

    const response = await sendEmail({ to: email, subject, text, html });

    console.log('2FA email send attempt completed:', {
      to: email,
      statusCode: response.statusCode,
      messageId: response.headers['x-message-id'],
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ 
      message: '2FA code sent successfully',
      messageId: response.headers['x-message-id']
    });
  } catch (error) {
    console.error('Failed to send 2FA email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
    next(error);
  }
}

export { sendTwoFactorAuthEmail };