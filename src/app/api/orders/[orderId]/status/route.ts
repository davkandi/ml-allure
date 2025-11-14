import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, inventoryLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRoles, createAuthErrorResponse } from "@/lib/auth";

const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP", "SHIPPED"],
  READY_FOR_PICKUP: ["DELIVERED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  // SECURITY FIX: Only ADMIN and STAFF can change order status
  const authCheck = requireRoles(request, ['ADMIN', 'STAFF', 'SALES_STAFF']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Only staff can change order status',
      403
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
    const { newStatus, note } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "newStatus is required", code: "MISSING_NEW_STATUS" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
          code: "INVALID_STATUS",
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
    const currentStatus = order.status;

    // Validate status transition
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(", ")}`,
          code: "INVALID_STATUS_TRANSITION",
        },
        { status: 400 }
      );
    }

    const now = Date.now();
    const updateData: any = {
      status: newStatus,
      updatedAt: now,
    };

    // Set completedAt for terminal statuses
    if (newStatus === "DELIVERED" || newStatus === "CANCELLED") {
      updateData.completedAt = now;
    }

    // Update order status
    const updatedOrder = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, parseInt(orderId)))
      .returning();

    // Create status history entry in inventory logs
    await db.insert(inventoryLogs).values({
      variantId: null as any, // Status changes don't need variant
      changeType: "ADJUSTMENT",
      quantityChange: 0,
      previousQuantity: 0,
      newQuantity: 0,
      reason: `Status changed from ${currentStatus} to ${newStatus}${note ? `: ${note}` : ""}`,
      performedBy: user.id, // SECURITY FIX: Use authenticated user ID
      orderId: parseInt(orderId),
      createdAt: now,
    });

    // TODO: Send notification to customer (SMS/Email)
    console.log(`[NOTIFICATION] Order ${order.orderNumber} status changed to ${newStatus}`);

    return NextResponse.json({
      message: "Order status updated successfully",
      order: updatedOrder[0],
      previousStatus: currentStatus,
      newStatus,
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}
