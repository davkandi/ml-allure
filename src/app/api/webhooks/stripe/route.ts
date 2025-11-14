import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { verifyWebhookSignature, handlePaymentSuccess, handlePaymentFailure } from '@/lib/stripe';
import { db } from '@/db';
import { orders, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logPaymentEvent, logError } from '@/lib/logger';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature, webhookSecret!);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'payment_intent.created':
        // Log payment intent creation
        console.log('Payment intent created:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    logError(error as Error, {
      operation: 'stripe_webhook_handler',
    });

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { orderId, amount, paymentIntentId } = await handlePaymentSuccess(paymentIntent);

  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  const now = Date.now();

  try {
    // Update order payment status
    await db
      .update(orders)
      .set({
        paymentStatus: 'PAID',
        paymentReference: paymentIntentId,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    // Create or update transaction record
    const existingTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reference, paymentIntentId))
      .limit(1);

    if (existingTransactions.length > 0) {
      // Update existing transaction
      await db
        .update(transactions)
        .set({
          status: 'COMPLETED',
          verifiedAt: now,
          updatedAt: now,
        })
        .where(eq(transactions.id, existingTransactions[0].id));
    } else {
      // Create new transaction record
      await db.insert(transactions).values({
        orderId,
        amount,
        method: 'STRIPE',
        provider: 'Stripe',
        reference: paymentIntentId,
        status: 'COMPLETED',
        verifiedBy: null,
        verifiedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    logPaymentEvent({
      type: 'PAYMENT_VERIFIED',
      orderId,
      amount,
      provider: 'Stripe',
      reference: paymentIntentId,
    });

    console.log(`Payment succeeded for order ${orderId}`);
  } catch (error) {
    logError(error as Error, {
      operation: 'handle_payment_success',
      additionalInfo: { orderId, paymentIntentId },
    });
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { orderId, paymentIntentId, error: failureReason } = await handlePaymentFailure(paymentIntent);

  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  const now = Date.now();

  try {
    // Update order payment status
    await db
      .update(orders)
      .set({
        paymentStatus: 'FAILED',
        paymentReference: paymentIntentId,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    // Update or create transaction record
    const existingTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reference, paymentIntentId))
      .limit(1);

    if (existingTransactions.length > 0) {
      await db
        .update(transactions)
        .set({
          status: 'FAILED',
          updatedAt: now,
        })
        .where(eq(transactions.id, existingTransactions[0].id));
    }

    console.log(`Payment failed for order ${orderId}: ${failureReason}`);
  } catch (error) {
    logError(error as Error, {
      operation: 'handle_payment_failure',
      additionalInfo: { orderId, paymentIntentId },
    });
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const orderId = parseInt(paymentIntent.metadata.orderId || '0');
  const paymentIntentId = paymentIntent.id;

  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  const now = Date.now();

  try {
    // Update order payment status
    await db
      .update(orders)
      .set({
        paymentStatus: 'PENDING',
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    // Update transaction record
    const existingTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reference, paymentIntentId))
      .limit(1);

    if (existingTransactions.length > 0) {
      await db
        .update(transactions)
        .set({
          status: 'CANCELLED',
          updatedAt: now,
        })
        .where(eq(transactions.id, existingTransactions[0].id));
    }

    console.log(`Payment canceled for order ${orderId}`);
  } catch (error) {
    logError(error as Error, {
      operation: 'handle_payment_canceled',
      additionalInfo: { orderId, paymentIntentId },
    });
  }
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.error('No payment intent in charge');
    return;
  }

  const now = Date.now();

  try {
    // Find transaction by payment intent reference
    const existingTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reference, paymentIntentId))
      .limit(1);

    if (existingTransactions.length === 0) {
      console.error(`Transaction not found for payment intent: ${paymentIntentId}`);
      return;
    }

    const transaction = existingTransactions[0];
    const orderId = transaction.orderId;

    // Update order payment status
    await db
      .update(orders)
      .set({
        paymentStatus: 'REFUNDED',
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    // Update transaction
    await db
      .update(transactions)
      .set({
        status: 'REFUNDED',
        updatedAt: now,
      })
      .where(eq(transactions.id, transaction.id));

    logPaymentEvent({
      type: 'REFUND',
      orderId,
      amount: charge.amount_refunded / 100,
      provider: 'Stripe',
      reference: paymentIntentId,
    });

    console.log(`Refund processed for order ${orderId}`);
  } catch (error) {
    logError(error as Error, {
      operation: 'handle_refund',
      additionalInfo: { paymentIntentId },
    });
  }
}

// Disable body parsing for webhooks (Stripe requires raw body)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
