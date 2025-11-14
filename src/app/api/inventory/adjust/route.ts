import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productVariants, inventoryLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRoles, createAuthErrorResponse } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  // SECURITY FIX: Require ADMIN or INVENTORY_MANAGER role
  const authCheck = requireRoles(request, ['ADMIN', 'INVENTORY_MANAGER', 'STAFF']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Unauthorized access to inventory',
      authCheck.error?.includes('permissions') ? 403 : 401
    );
  }

  const authenticatedUser = authCheck.authResult.user!;

  try {
    const body = await request.json();
    const { variantId, quantityChange, reason, changeType } = body;

    // Validate input
    if (!variantId || quantityChange === undefined || !reason || !changeType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current variant
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    if (!variant) {
      return NextResponse.json(
        { error: "Variant not found" },
        { status: 404 }
      );
    }

    const previousQuantity = variant.stockQuantity;
    const newQuantity = previousQuantity + quantityChange;

    // Prevent negative stock
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: "Stock quantity cannot be negative" },
        { status: 400 }
      );
    }

    // Update variant stock
    await db
      .update(productVariants)
      .set({
        stockQuantity: newQuantity,
        updatedAt: Date.now(),
      })
      .where(eq(productVariants.id, variantId));

    // Create inventory log
    const [log] = await db
      .insert(inventoryLogs)
      .values({
        variantId,
        changeType, // 'RESTOCK', 'ADJUSTMENT', 'RETURN'
        quantityChange,
        previousQuantity,
        newQuantity,
        reason,
        performedBy: authenticatedUser.id, // SECURITY FIX: Use authenticated user ID
        createdAt: Date.now(),
      })
      .returning();

    // Get updated variant
    const [updatedVariant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    return NextResponse.json({
      success: true,
      variant: updatedVariant,
      log,
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
