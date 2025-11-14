import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, refunds, orderItems, productVariants, inventoryLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, requireRoles, createAuthErrorResponse } from '@/lib/auth';

// Statuses that can be cancelled
const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING'];

interface CancelOrderRequest {
  reason: string;
  refundMethod?: 'MOBILE_MONEY' | 'CASH' | 'STORE_CREDIT';
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // SECURITY: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;
  const { orderId } = await params;

  try {
    // Validate order ID
    if (!orderId || isNaN(parseInt(orderId))) {
      return NextResponse.json({
        error: 'Valid order ID is required',
        code: 'INVALID_ORDER_ID'
      }, { status: 400 });
    }

    // Parse request body
    const body: CancelOrderRequest = await request.json();

    if (!body.reason) {
      return NextResponse.json({
        error: 'Cancellation reason is required',
        code: 'MISSING_REASON'
      }, { status: 400 });
    }

    // Fetch the order
    const order = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }, { status: 404 });
    }

    const currentOrder = order[0];

    // IDOR Protection: Customers can only cancel their own orders
    if (user.role === 'CUSTOMER' && currentOrder.customerId !== user.id) {
      return createAuthErrorResponse(
        'You can only cancel your own orders',
        403
      );
    }

    // Check if order is already cancelled
    if (currentOrder.status === 'CANCELLED') {
      return NextResponse.json({
        error: 'Order is already cancelled',
        code: 'ALREADY_CANCELLED'
      }, { status: 400 });
    }

    // Check if order can be cancelled
    if (!CANCELLABLE_STATUSES.includes(currentOrder.status)) {
      return NextResponse.json({
        error: `Cannot cancel order with status ${currentOrder.status}. Only orders with status ${CANCELLABLE_STATUSES.join(', ')} can be cancelled.`,
        code: 'CANNOT_CANCEL'
      }, { status: 400 });
    }

    // Check if already refunded
    if (currentOrder.paymentStatus === 'REFUNDED') {
      return NextResponse.json({
        error: 'Order payment is already refunded',
        code: 'ALREADY_REFUNDED'
      }, { status: 400 });
    }

    const now = Date.now();
    const refundAmount = currentOrder.total;
    const refundMethod = body.refundMethod || 'MOBILE_MONEY';

    // Create refund record
    const newRefund = await db.insert(refunds)
      .values({
        orderId: currentOrder.id,
        amount: refundAmount,
        reason: body.reason,
        status: 'PENDING',
        refundMethod: refundMethod,
        processedBy: user.id,
        notes: body.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Update order status to CANCELLED and payment status to REFUNDED
    const updatedOrder = await db.update(orders)
      .set({
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        updatedAt: now,
        completedAt: currentOrder.completedAt || now,
      })
      .where(eq(orders.id, currentOrder.id))
      .returning();

    // Restore inventory for cancelled order
    // Fetch order items to restore inventory
    const items = await db.select()
      .from(orderItems)
      .where(eq(orderItems.orderId, currentOrder.id));

    for (const item of items) {
      // Get current variant stock
      const variant = await db.select()
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);

      if (variant.length > 0) {
        const currentStock = variant[0].stockQuantity;
        const newStock = currentStock + item.quantity;

        // Update variant stock
        await db.update(productVariants)
          .set({
            stockQuantity: newStock,
            updatedAt: now,
          })
          .where(eq(productVariants.id, item.variantId));

        // Log inventory change
        await db.insert(inventoryLogs)
          .values({
            variantId: item.variantId,
            changeType: 'RETURN',
            quantityChange: item.quantity,
            previousQuantity: currentStock,
            newQuantity: newStock,
            reason: `Order cancelled: ${body.reason}`,
            performedBy: user.id,
            orderId: currentOrder.id,
            createdAt: now,
          });
      }
    }

    // TODO: Integrate with Stripe to process actual refund
    // For now, we mark the refund as PROCESSING
    await db.update(refunds)
      .set({
        status: 'PROCESSING',
        processedAt: now,
        updatedAt: now,
      })
      .where(eq(refunds.id, newRefund[0].id));

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder[0],
      refund: {
        id: newRefund[0].id,
        amount: refundAmount,
        status: 'PROCESSING',
        method: refundMethod,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json({
      error: 'Failed to cancel order: ' + (error as Error).message,
      code: 'CANCELLATION_FAILED'
    }, { status: 500 });
  }
}
