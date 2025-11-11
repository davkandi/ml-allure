import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryLogs, users, orders, productVariants, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;
    const variantIdNum = parseInt(variantId);

    if (isNaN(variantIdNum)) {
      return NextResponse.json(
        { error: "Invalid variant ID" },
        { status: 400 }
      );
    }

    // Get variant info
    const [variant] = await db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        stockQuantity: productVariants.stockQuantity,
        productId: productVariants.productId,
        productName: products.name,
      })
      .from(productVariants)
      .leftJoin(products, eq(productVariants.productId, products.id))
      .where(eq(productVariants.id, variantIdNum))
      .limit(1);

    if (!variant) {
      return NextResponse.json(
        { error: "Variant not found" },
        { status: 404 }
      );
    }

    // Get inventory logs with user and order info
    const logs = await db
      .select({
        id: inventoryLogs.id,
        changeType: inventoryLogs.changeType,
        quantityChange: inventoryLogs.quantityChange,
        previousQuantity: inventoryLogs.previousQuantity,
        newQuantity: inventoryLogs.newQuantity,
        reason: inventoryLogs.reason,
        createdAt: inventoryLogs.createdAt,
        orderId: inventoryLogs.orderId,
        orderNumber: orders.orderNumber,
        performedBy: inventoryLogs.performedBy,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(inventoryLogs)
      .leftJoin(users, eq(inventoryLogs.performedBy, users.id))
      .leftJoin(orders, eq(inventoryLogs.orderId, orders.id))
      .where(eq(inventoryLogs.variantId, variantIdNum))
      .orderBy(desc(inventoryLogs.createdAt));

    return NextResponse.json({
      variant,
      logs,
    });
  } catch (error) {
    console.error("Error fetching inventory history:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory history" },
      { status: 500 }
    );
  }
}
