import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, productVariants, inventoryLogs, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId,
      paymentMethod,
      amountReceived,
      mobileProvider,
      mobilePhone,
      referenceNumber,
      items,
    } = body;

    // Validate required fields
    if (!paymentMethod || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Validate payment method specific fields
    if (paymentMethod === "CASH" && !amountReceived) {
      return NextResponse.json(
        { error: "Montant reçu requis pour le paiement en espèces" },
        { status: 400 }
      );
    }

    if (paymentMethod === "MOBILE_MONEY" && (!mobileProvider || !mobilePhone || !referenceNumber)) {
      return NextResponse.json(
        { error: "Informations Mobile Money incomplètes" },
        { status: 400 }
      );
    }

    // Calculate total
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.priceAtPurchase * item.quantity;
    }

    const total = subtotal;

    // Validate cash payment amount
    if (paymentMethod === "CASH" && amountReceived < total) {
      return NextResponse.json(
        { error: "Montant reçu insuffisant" },
        { status: 400 }
      );
    }

    // Check stock availability for all items
    for (const item of items) {
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, item.variantId),
      });

      if (!variant) {
        return NextResponse.json(
          { error: `Variante ${item.variantId} introuvable` },
          { status: 404 }
        );
      }

      if (variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour ${item.productName}` },
          { status: 400 }
        );
      }
    }

    // Generate order number
    const orderCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    const orderNumber = `ORD-${Date.now()}-${(orderCount[0]?.count || 0) + 1}`;

    // Determine payment status
    const paymentStatus = paymentMethod === "CASH" ? "PAID" : "PENDING";

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerId: customerId || null,
        status: "COMPLETED", // IN_STORE orders are immediately completed
        paymentMethod,
        paymentStatus,
        deliveryMethod: "STORE_PICKUP",
        deliveryFee: 0,
        subtotal,
        total,
        source: "IN_STORE",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create order items and deduct stock
    const createdItems = [];
    for (const item of items) {
      // Create order item
      const [orderItem] = await db
        .insert(orderItems)
        .values({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
          productName: item.productName,
          variantDetails: item.variantDetails,
          createdAt: new Date(),
        })
        .returning();

      createdItems.push(orderItem);

      // Deduct stock
      await db
        .update(productVariants)
        .set({
          stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, item.variantId));

      // Log inventory adjustment
      await db.insert(inventoryLogs).values({
        variantId: item.variantId,
        changeType: "SALE",
        quantityChange: -item.quantity,
        reason: `Vente POS - Commande ${orderNumber}`,
        performedBy: "POS_SYSTEM",
        createdAt: new Date(),
      });
    }

    // Create transaction record
    const transactionAmount = paymentMethod === "CASH" ? amountReceived : total;
    await db.insert(transactions).values({
      orderId: order.id,
      transactionType: paymentMethod === "CASH" ? "CASH" : "MOBILE_MONEY",
      amount: transactionAmount,
      status: paymentStatus === "PAID" ? "COMPLETED" : "PENDING",
      paymentMethod,
      mobileProvider: mobileProvider || null,
      mobilePhone: mobilePhone || null,
      referenceNumber: referenceNumber || orderNumber,
      createdAt: new Date(),
    });

    // Calculate change for cash payments
    const change = paymentMethod === "CASH" ? amountReceived - total : 0;

    return NextResponse.json({
      order: {
        ...order,
        items: createdItems,
      },
      change: change > 0 ? change : undefined,
    });
  } catch (error) {
    console.error("POS sale error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la vente" },
      { status: 500 }
    );
  }
}
