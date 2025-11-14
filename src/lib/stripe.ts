import Stripe from 'stripe';
import { logPaymentEvent, logError } from './logger';

// Initialize Stripe with API key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});

/**
 * Create a Stripe Payment Intent for an order
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency?: string;
  orderId: number;
  customerId?: number;
  metadata?: Record<string, string>;
}) {
  try {
    const { amount, currency = 'usd', orderId, customerId, metadata = {} } = params;

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata: {
        orderId: orderId.toString(),
        customerId: customerId?.toString() || '',
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logPaymentEvent({
      type: 'PAYMENT_INITIATED',
      orderId,
      amount,
      reference: paymentIntent.id,
      userId: customerId,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    logError(error as Error, {
      operation: 'create_payment_intent',
      userId: params.customerId,
      additionalInfo: { orderId: params.orderId, amount: params.amount },
    });

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Retrieve a Payment Intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    logError(error as Error, {
      operation: 'get_payment_intent',
      additionalInfo: { paymentIntentId },
    });

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Cancel a Payment Intent
 */
export async function cancelPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    logError(error as Error, {
      operation: 'cancel_payment_intent',
      additionalInfo: { paymentIntentId },
    });

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Create a refund for a payment
 */
export async function createRefund(params: {
  paymentIntentId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}) {
  try {
    const { paymentIntentId, amount, reason, metadata = {} } = params;

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      metadata,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to cents
    }

    if (reason) {
      refundParams.reason = reason;
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      success: true,
      refund,
    };
  } catch (error) {
    logError(error as Error, {
      operation: 'create_refund',
      additionalInfo: params,
    });

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    logError(error as Error, {
      operation: 'verify_webhook_signature',
    });
    return null;
  }
}

/**
 * Handle successful payment
 */
export async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = parseInt(paymentIntent.metadata.orderId || '0');
  const customerId = parseInt(paymentIntent.metadata.customerId || '0');

  logPaymentEvent({
    type: 'PAYMENT_VERIFIED',
    orderId,
    amount: paymentIntent.amount / 100, // Convert from cents
    reference: paymentIntent.id,
    userId: customerId,
  });

  return {
    orderId,
    customerId,
    amount: paymentIntent.amount / 100,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Handle failed payment
 */
export async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const orderId = parseInt(paymentIntent.metadata.orderId || '0');
  const customerId = parseInt(paymentIntent.metadata.customerId || '0');

  logPaymentEvent({
    type: 'PAYMENT_FAILED',
    orderId,
    amount: paymentIntent.amount / 100,
    reference: paymentIntent.id,
    userId: customerId,
    error: new Error(paymentIntent.last_payment_error?.message || 'Payment failed'),
  });

  return {
    orderId,
    customerId,
    amount: paymentIntent.amount / 100,
    paymentIntentId: paymentIntent.id,
    error: paymentIntent.last_payment_error?.message,
  };
}

/**
 * Get Stripe publishable key for frontend
 */
export function getStripePublishableKey(): string {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is required');
  }

  return publishableKey;
}
