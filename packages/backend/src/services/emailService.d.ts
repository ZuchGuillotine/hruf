/**
 * Email data interface
 */
interface EmailData {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}
/**
 * Sends an email using SendGrid
 * @param emailData The email data to send
 * @returns true if email was sent successfully, false otherwise
 */
export declare function sendEmail(emailData: EmailData): Promise<boolean>;
/**
 * Sends a welcome email to a new user
 * @param email The user's email address
 * @param username The user's username
 * @returns true if email was sent successfully, false otherwise
 */
export declare function sendWelcomeEmail(email: string, username: string): Promise<boolean>;
export {};
//# sourceMappingURL=emailService.d.ts.map
