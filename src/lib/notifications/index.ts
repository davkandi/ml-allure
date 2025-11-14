/**
 * Unified Notification Service
 *
 * Exports all notification services (Email and SMS)
 */

export { emailService } from './email';
export { smsService } from './sms';

export type { EmailOptions, TemplateEmailOptions } from './email';
export type { SMSOptions } from './sms';

// Re-export for convenience
import { emailService } from './email';
import { smsService } from './sms';

export const notificationService = {
  email: emailService,
  sms: smsService,
};
