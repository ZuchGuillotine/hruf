import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
export declare const EMAIL_TEMPLATES: {
  readonly WELCOME: string;
  readonly TWO_FACTOR: 'd-xxxxxxxxxxxxx';
  readonly PASSWORD_RESET: 'd-xxxxxxxxxxxxx';
  readonly DRIP_1: 'd-xxxxxxxxxxxxx';
  readonly DRIP_2: 'd-xxxxxxxxxxxxx';
  readonly DRIP_3: 'd-xxxxxxxxxxxxx';
};
export declare const DEFAULT_SENDER: {
  email: string;
  name: string;
};
export declare function sendEmail(data: MailDataRequired): Promise<boolean>;
export declare function sendTemplateEmail(
  to: string,
  templateId: string,
  dynamicData: Record<string, any>
): Promise<boolean>;
export declare function send2FAEmail(to: string, code: string, expiresIn: string): Promise<boolean>;
export declare function sendWelcomeEmail(to: string, username: string): Promise<boolean>;
export default sgMail;
//# sourceMappingURL=sendgrid.d.ts.map
