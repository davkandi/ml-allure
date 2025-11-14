import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthErrorResponse } from '@/lib/auth';
import { createPaymentIntent } from '@/lib/stripe';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/payments/stripe/create-intent
 * Create a Stripe Payment Intent for an order
 */
export async function POST(request: NextRequest) {
  // SECURITY: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Authentication required to create payment',
      401
    );
  }

  const authenticatedUser = authCheck.authResult.user!;

  try {
    const body = await request.json();
    const { orderId } = body;

    // Validate required fields
    if (!orderId || isNaN(parseInt(orderId))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid orderId is required',
          code: 'INVALID_ORDER_ID',
        },
        { status: 400 }
      );
    }

    // Fetch order
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // IDOR Protection: Customers can only create payment for their own orders
    if (
      authenticatedUser.role === 'CUSTOMER' &&
      order[0].customerId !== authenticatedUser.id
    ) {
      return createAuthErrorResponse(
        'You can only create payment for your own orders',
        403
      );
    }

    // Check if order is already paid
    if (order[0].paymentStatus === 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: 'Order is already paid',
          code: 'ORDER_ALREADY_PAID',
        },
        { status: 400 }
      );
    }

    // Create Stripe Payment Intent
    const result = await createPaymentIntent({
      amount: order[0].total,
      currency: 'usd', // TODO: Make this configurable
      orderId: order[0].id,
      customerId: order[0].customerId,
      metadata: {
        orderNumber: order[0].orderNumber,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create payment intent',
          code: 'PAYMENT_INTENT_CREATION_FAILED',
          details: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amount: order[0].total,
      currency: 'usd',
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
