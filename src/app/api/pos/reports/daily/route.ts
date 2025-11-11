import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// GET /api/pos/reports/daily - Get daily sales report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Calculate start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = startOfDay.getTime();
    const endTimestamp = endOfDay.getTime();

    // Fetch all IN_STORE orders for the day
    const dailyOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.source, "IN_STORE"),
          gte(orders.createdAt, startTimestamp),
          lte(orders.createdAt, endTimestamp)
        )
      );

    // Sales by hour
    const salesByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sales: 0,
      transactions: 0,
    }));

    dailyOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      salesByHour[hour].sales += order.total;
      salesByHour[hour].transactions += 1;
    });

    // Sales by payment method
    const paymentMethods = {
      CASH: { label: "Espèces", amount: 0, count: 0 },
      MOBILE_MONEY: { label: "Mobile Money", amount: 0, count: 0 },
    };

    dailyOrders.forEach((order) => {
      if (order.paymentMethod === "CASH") {
        paymentMethods.CASH.amount += order.total;
        paymentMethods.CASH.count += 1;
      } else if (
        order.paymentMethod?.includes("MOBILE_MONEY") ||
        order.paymentMethod?.includes("M-Pesa") ||
        order.paymentMethod?.includes("Airtel") ||
        order.paymentMethod?.includes("Orange")
      ) {
        paymentMethods.MOBILE_MONEY.amount += order.total;
        paymentMethods.MOBILE_MONEY.count += 1;
      }
    });

    // Top selling products
    const productSalesMap: Record<
      number,
      {
        productId: number;
        productName: string;
        quantity: number;
        revenue: number;
        image: string | null;
      }
    > = {};

    for (const order of dailyOrders) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      for (const item of items) {
        if (!productSalesMap[item.productId]) {
          // Get product info
          const productData = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          const product = productData[0];

          productSalesMap[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
            image: product?.images?.[0] || null,
          };
        }

        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += item.priceAtPurchase * item.quantity;
      }
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Sales by staff member (simplified)
    const staffSales = [
      {
        staffId: 1,
        staffName: "Sarah Koné",
        sales: dailyOrders.reduce((sum, o) => sum + o.total, 0),
        transactions: dailyOrders.length,
      },
    ];

    // Overall statistics
    const totalSales = dailyOrders.reduce((sum, o) => sum + o.total, 0);
    const totalTransactions = dailyOrders.length;
    const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    return NextResponse.json({
      date,
      summary: {
        totalSales,
        totalTransactions,
        avgTransaction,
      },
      salesByHour: salesByHour.filter((h) => h.sales > 0 || h.transactions > 0),
      paymentMethods: Object.entries(paymentMethods).map(([key, value]) => ({
        method: key,
        label: value.label,
        amount: value.amount,
        count: value.count,
        percentage:
          totalSales > 0 ? ((value.amount / totalSales) * 100).toFixed(1) : "0",
      })),
      topProducts,
      staffSales,
    });
  } catch (error) {
    console.error("Error generating daily report:", error);
    return NextResponse.json(
      { error: "Failed to generate daily report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}