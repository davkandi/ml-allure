/**
 * Email Notification Service - SendGrid Integration
 *
 * Handles all email notifications for the ML Allure platform
 */

import { db } from '@/db';
import { notifications, emailTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  orderId?: number;
  customerId?: number;
}

export interface TemplateEmailOptions {
  to: string;
  templateCode: string;
  variables: Record<string, any>;
  orderId?: number;
  customerId?: number;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@mlallure.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'ML Allure';
    this.enabled = !!this.apiKey;
  }

  /**
   * Send a plain email
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const now = Date.now();

    try {
      if (!this.enabled) {
        console.warn('[Email Service] SendGrid not configured. Email would be sent to:', options.to);

        // Log to database even if not sent
        await db.insert(notifications).values({
          type: 'EMAIL',
          recipient: options.to,
          subject: options.subject,
          content: options.html,
          status: 'FAILED',
          provider: 'SENDGRID',
          error: 'SendGrid API key not configured',
          orderId: options.orderId || null,
          customerId: options.customerId || null,
          createdAt: now,
        });

        return {
          success: false,
          error: 'SendGrid not configured'
        };
      }

      // Prepare SendGrid payload
      const payload = {
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject,
          },
        ],
        from: {
          email: options.from || this.fromEmail,
          name: this.fromName,
        },
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
        ],
      };

      if (options.text) {
        payload.content.push({
          type: 'text/plain',
          value: options.text,
        });
      }

      if (options.replyTo) {
        (payload as any).reply_to = { email: options.replyTo };
      }

      // Send via SendGrid API
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
      }

      const messageId = response.headers.get('x-message-id') || undefined;

      // Log successful send
      await db.insert(notifications).values({
        type: 'EMAIL',
        recipient: options.to,
        subject: options.subject,
        content: options.html,
        status: 'SENT',
        provider: 'SENDGRID',
        providerId: messageId || null,
        orderId: options.orderId || null,
        customerId: options.customerId || null,
        sentAt: now,
        createdAt: now,
      });

      return { success: true, messageId };
    } catch (error) {
      console.error('[Email Service] Failed to send email:', error);

      // Log failed send
      await db.insert(notifications).values({
        type: 'EMAIL',
        recipient: options.to,
        subject: options.subject,
        content: options.html,
        status: 'FAILED',
        provider: 'SENDGRID',
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
   * Send email using a template
   */
  async sendTemplateEmail(options: TemplateEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Fetch template from database
      const template = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.code, options.templateCode))
        .limit(1);

      if (template.length === 0) {
        throw new Error(`Email template not found: ${options.templateCode}`);
      }

      const emailTemplate = template[0];

      if (!emailTemplate.isActive) {
        throw new Error(`Email template is not active: ${options.templateCode}`);
      }

      // Replace variables in subject and content
      let subject = emailTemplate.subject;
      let htmlContent = emailTemplate.htmlContent;
      let textContent = emailTemplate.textContent || '';

      Object.keys(options.variables).forEach(key => {
        const value = options.variables[key];
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
        textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
      });

      return await this.sendEmail({
        to: options.to,
        subject,
        html: htmlContent,
        text: textContent || undefined,
        orderId: options.orderId,
        customerId: options.customerId,
      });
    } catch (error) {
      console.error('[Email Service] Failed to send template email:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(orderData: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    orderTotal: number;
    orderItems: Array<{ name: string; quantity: number; price: number }>;
    orderId: number;
    customerId: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const itemsHtml = orderData.orderItems
      .map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>$${item.price.toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const html = `
      <h1>Order Confirmation</h1>
      <p>Dear ${orderData.customerName},</p>
      <p>Thank you for your order! Your order number is <strong>${orderData.orderNumber}</strong>.</p>

      <h2>Order Details</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2"><strong>Total</strong></td>
            <td><strong>$${orderData.orderTotal.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <p>We'll send you another email when your order ships.</p>
      <p>Thank you for shopping with ML Allure!</p>
    `;

    return await this.sendEmail({
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html,
      orderId: orderData.orderId,
      customerId: orderData.customerId,
    });
  }

  /**
   * Send shipping notification email
   */
  async sendShippingNotification(shipmentData: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    trackingNumber?: string;
    carrier?: string;
    orderId: number;
    customerId: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = `
      <h1>Your Order Has Shipped!</h1>
      <p>Dear ${shipmentData.customerName},</p>
      <p>Great news! Your order <strong>${shipmentData.orderNumber}</strong> has been shipped.</p>

      ${shipmentData.trackingNumber ? `
        <h2>Tracking Information</h2>
        <p><strong>Carrier:</strong> ${shipmentData.carrier || 'N/A'}</p>
        <p><strong>Tracking Number:</strong> ${shipmentData.trackingNumber}</p>
      ` : ''}

      <p>Thank you for shopping with ML Allure!</p>
    `;

    return await this.sendEmail({
      to: shipmentData.customerEmail,
      subject: `Your Order ${shipmentData.orderNumber} Has Shipped`,
      html,
      orderId: shipmentData.orderId,
      customerId: shipmentData.customerId,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
