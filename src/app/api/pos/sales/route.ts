import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, customers, transactions } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// GET /api/pos/sales - Get IN_STORE sales with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build conditions array
    const conditions: any[] = [eq(orders.source, "IN_STORE")];

    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate).getTime()));
    }

    if (endDate) {
      conditions.push(lte(orders.createdAt, new Date(endDate).getTime()));
    }

    // Fetch all orders first
    const allOrders = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));

    // Paginate
    const paginatedOrders = allOrders.slice(offset, offset + limit);

    // Fetch related data for paginated orders
    const sales = [];
    for (const order of paginatedOrders) {
      // Get customer
      let customer = null;
      if (order.customerId) {
        const customerData = await db
          .select()
          .from(customers)
          .where(eq(customers.id, order.customerId))
          .limit(1);
        customer = customerData[0] || null;
      }

      // Get transaction
      let transaction = null;
      const transactionData = await db
        .select()
        .from(transactions)
        .where(eq(transactions.orderId, order.id))
        .limit(1);
      transaction = transactionData[0] || null;

      // Get items
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      sales.push({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        total: order.total,
        customer: customer
          ? {
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              phone: customer.phone,
              isGuest: customer.isGuest,
            }
          : null,
        items,
        itemCount,
        transaction: transaction
          ? {
              id: transaction.id,
              reference: transaction.reference,
              provider: transaction.provider,
            }
          : null,
      });
    }

    // Calculate summary
    const totalSales = allOrders.reduce((sum, o) => sum + o.total, 0);
    const transactionCount = allOrders.length;
    const avgTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;

    const cashSales = allOrders
      .filter((o) => o.paymentMethod === "CASH")
      .reduce((sum, o) => sum + o.total, 0);

    const cashCount = allOrders.filter((o) => o.paymentMethod === "CASH").length;

    const mobileMoneyOrders = allOrders.filter(
      (o) =>
        o.paymentMethod?.includes("MOBILE_MONEY") ||
        o.paymentMethod?.includes("M-Pesa") ||
        o.paymentMethod?.includes("Airtel") ||
        o.paymentMethod?.includes("Orange")
    );
    const mobileMoneySales = mobileMoneyOrders.reduce((sum, o) => sum + o.total, 0);

    return NextResponse.json({
      sales,
      summary: {
        totalSales,
        transactionCount,
        avgTransaction,
        cashSales,
        cashCount,
        mobileMoneySales,
        mobileMoneyCount: mobileMoneyOrders.length,
      },
      pagination: {
        page,
        limit,
        total: transactionCount,
        totalPages: Math.ceil(transactionCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching POS sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}