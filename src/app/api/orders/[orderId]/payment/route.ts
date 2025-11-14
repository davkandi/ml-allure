import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, createAuthErrorResponse } from "@/lib/auth";

const VALID_PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  // SECURITY FIX: Require authentication to update payment status
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required to update payment',
      401
    );
  }

  const user = authCheck.authResult.user!;

  try {
    const { orderId } = params;

    if (!orderId || isNaN(parseInt(orderId))) {
      return NextResponse.json(
        { error: "Valid order ID is required", code: "INVALID_ORDER_ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { paymentStatus, reference } = body;

    if (!paymentStatus) {
      return NextResponse.json(
        {
          error: "paymentStatus is required",
          code: "MISSING_PAYMENT_STATUS",
        },
        { status: 400 }
      );
    }

    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json(
        {
          error: `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUSES.join(", ")}`,
          code: "INVALID_PAYMENT_STATUS",
        },
        { status: 400 }
      );
    }

    // Fetch current order
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { error: "Order not found", code: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const order = existingOrder[0];

    // IDOR Protection: Customers can only update their own order payments
    if (user.role === 'CUSTOMER' && order.customerId !== user.id) {
      return createAuthErrorResponse(
        'You can only update payments for your own orders',
        403
      );
    }
    // Admin, Staff, Sales Staff can update any order's payment
    const now = Date.now();

    // Update order payment status and reference
    const updateData: any = {
      paymentStatus,
      updatedAt: now,
    };

    if (reference) {
      updateData.paymentReference = reference;
    }

    const updatedOrder = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, parseInt(orderId)))
      .returning();

    // Update or create transaction record
    const existingTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.orderId, parseInt(orderId)))
      .limit(1);

    const transactionStatus =
      paymentStatus === "PAID"
        ? "COMPLETED"
        : paymentStatus === "FAILED"
          ? "FAILED"
          : "PENDING";

    if (existingTransactions.length > 0) {
      // Update existing transaction
      await db
        .update(transactions)
        .set({
          status: transactionStatus,
          reference: reference || existingTransactions[0].reference,
          verifiedAt: paymentStatus === "PAID" ? now : null,
          verifiedBy: paymentStatus === "PAID" ? user.id : null, // SECURITY FIX: Use authenticated user ID
          updatedAt: now,
        })
        .where(eq(transactions.id, existingTransactions[0].id));
    } else {
      // Create new transaction record
      await db.insert(transactions).values({
        orderId: parseInt(orderId),
        amount: order.total,
        method: order.paymentMethod,
        provider: order.paymentMethod === "MOBILE_MONEY" ? "M-Pesa" : null,
        reference: reference || null,
        status: transactionStatus,
        verifiedBy: paymentStatus === "PAID" ? user.id : null, // SECURITY FIX: Use authenticated user ID
        verifiedAt: paymentStatus === "PAID" ? now : null,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      message: "Payment status updated successfully",
      order: updatedOrder[0],
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}
