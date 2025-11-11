import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productVariants, products, categories } from "@/db/schema";
import { eq, like, or, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";
    const outOfStockOnly = searchParams.get("outOfStockOnly") === "true";
    const search = searchParams.get("search");

    // Build query
    let query = db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        colorHex: productVariants.colorHex,
        stockQuantity: productVariants.stockQuantity,
        additionalPrice: productVariants.additionalPrice,
        isActive: productVariants.isActive,
        updatedAt: productVariants.updatedAt,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        basePrice: products.basePrice,
        categoryId: categories.id,
        categoryName: categories.name,
      })
      .from(productVariants)
      .leftJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .$dynamic();

    // Apply filters
    const conditions = [];

    if (category && category !== "all") {
      conditions.push(eq(categories.slug, category));
    }

    if (lowStockOnly) {
      conditions.push(
        sql`${productVariants.stockQuantity} > 0 AND ${productVariants.stockQuantity} <= 5`
      );
    }

    if (outOfStockOnly) {
      conditions.push(eq(productVariants.stockQuantity, 0));
    }

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(productVariants.sku, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`);
    }

    const variants = await query;

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
