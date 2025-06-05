/**
 * Sends a verification email to a new user.
 */
export declare function sendVerificationEmail(to: string, verificationToken: string): Promise<void>;
/**
 * Sends a 2FA code via email.
 */
export declare function send2FACodeEmail(to: string, code: string): Promise<void>;
/**
 * Sends a password reset email.
 */
export declare function sendPasswordResetEmail(to: string, resetToken: string): Promise<void>;
/**
 * Sends a welcome email after successful registration.
 */
export declare function sendWelcomeEmail(to: string, username: string): Promise<void>;
/**
 * Sends a notification about suspicious login activity.
 */
export declare function sendSecurityAlertEmail(
  to: string,
  location: string,
  device: string
): Promise<void>;
export declare function generateVerificationToken(): string;
//# sourceMappingURL=email.d.ts.map
