/**
 * SMS Notification Service - Twilio Integration
 *
 * Handles all SMS notifications for the ML Allure platform
 */

import { db } from '@/db';
import { notifications } from '@/db/schema';

export interface SMSOptions {
  to: string;
  message: string;
  orderId?: number;
  customerId?: number;
}

class SMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private enabled: boolean;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.enabled = !!(this.accountSid && this.authToken && this.fromNumber);
  }

  /**
   * Send an SMS message
   */
  async sendSMS(options: SMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const now = Date.now();

    try {
      if (!this.enabled) {
        console.warn('[SMS Service] Twilio not configured. SMS would be sent to:', options.to);

        // Log to database even if not sent
        await db.insert(notifications).values({
          type: 'SMS',
          recipient: options.to,
          subject: null,
          content: options.message,
          status: 'FAILED',
          provider: 'TWILIO',
          error: 'Twilio credentials not configured',
          orderId: options.orderId || null,
          customerId: options.customerId || null,
          createdAt: now,
        });

        return {
          success: false,
          error: 'Twilio not configured'
        };
      }

      // Validate phone number format
      if (!options.to.startsWith('+')) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }

      // Prepare Twilio payload
      const payload = new URLSearchParams({
        To: options.to,
        From: this.fromNumber,
        Body: options.message,
      });

      // Send via Twilio API
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: payload.toString(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twilio API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      const messageId = data.sid;

      // Log successful send
      await db.insert(notifications).values({
        type: 'SMS',
        recipient: options.to,
        subject: null,
        content: options.message,
        status: 'SENT',
        provider: 'TWILIO',
        providerId: messageId,
        orderId: options.orderId || null,
        customerId: options.customerId || null,
        sentAt: now,
        createdAt: now,
      });

      return { success: true, messageId };
    } catch (error) {
      console.error('[SMS Service] Failed to send SMS:', error);

      // Log failed send
      await db.insert(notifications).values({
        type: 'SMS',
        recipient: options.to,
        subject: null,
        content: options.message,
        status: 'FAILED',
        provider: 'TWILIO',
        error: (error as Error).message,
        orderId: options.orderId || null,
        customerId: options.customerId || null,
        createdAt: now,
      });

      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmationSMS(data: {
    phone: string;
    customerName: string;
    orderNumber: string;
    orderTotal: number;
    orderId: number;
    customerId: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Hi ${data.customerName}! Your order ${data.orderNumber} has been confirmed. Total: $${data.orderTotal.toFixed(2)}. Thank you for shopping with ML Allure!`;

    return await this.sendSMS({
      to: data.phone,
      message,
      orderId: data.orderId,
      customerId: data.customerId,
    });
  }

  /**
   * Send shipping notification SMS
   */
  async sendShippingNotificationSMS(data: {
    phone: string;
    customerName: string;
    orderNumber: string;
    trackingNumber?: string;
    orderId: number;
    customerId: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let message = `Hi ${data.customerName}! Your order ${data.orderNumber} has shipped!`;

    if (data.trackingNumber) {
      message += ` Track it: ${data.trackingNumber}`;
    }

    message += ' - ML Allure';

    return await this.sendSMS({
      to: data.phone,
      message,
      orderId: data.orderId,
      customerId: data.customerId,
    });
  }

  /**
   * Send delivery notification SMS
   */
  async sendDeliveryNotificationSMS(data: {
    phone: string;
    customerName: string;
    orderNumber: string;
    orderId: number;
    customerId: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Hi ${data.customerName}! Your order ${data.orderNumber} has been delivered. Enjoy your purchase from ML Allure!`;

    return await this.sendSMS({
      to: data.phone,
      message,
      orderId: data.orderId,
      customerId: data.customerId,
    });
  }

  /**
   * Send cancellation notification SMS
   */
  async sendCancellationNotificationSMS(data: {
    phone: string;
    customerName: string;
    orderNumber: string;
    orderId: number;
    customerId: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Hi ${data.customerName}. Your order ${data.orderNumber} has been cancelled. A refund will be processed shortly. - ML Allure`;

    return await this.sendSMS({
      to: data.phone,
      message,
      orderId: data.orderId,
      customerId: data.customerId,
    });
  }
}

// Export singleton instance
export const smsService = new SMSService();
