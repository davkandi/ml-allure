import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariants, categories } from "@/db/schema";
import { eq, or, like, and, sql, gt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [] });
    }

    // Search products by name, SKU, or barcode
    const searchPattern = `%${query}%`;

    // First, find matching products
    const matchingProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        images: products.images,
        categoryId: products.categoryId,
        isActive: products.isActive,
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            like(products.name, searchPattern),
            like(products.slug, searchPattern)
          )
        )
      )
      .limit(10);

    // Find matching product variants by SKU
    const matchingVariants = await db
      .select({
        productId: productVariants.productId,
        variantId: productVariants.id,
        sku: productVariants.sku,
      })
      .from(productVariants)
      .where(
        and(
          gt(productVariants.stockQuantity, 0),
          like(productVariants.sku, searchPattern)
        )
      )
      .limit(10);

    // Get unique product IDs from variant matches
    const variantProductIds = [...new Set(matchingVariants.map((v) => v.productId))];

    // Get products for matching variants
    const variantProducts = variantProductIds.length > 0
      ? await db
          .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            basePrice: products.basePrice,
            images: products.images,
            categoryId: products.categoryId,
            isActive: products.isActive,
          })
          .from(products)
          .where(
            and(
              eq(products.isActive, true),
              sql`${products.id} IN ${variantProductIds}`
            )
          )
      : [];

    // Combine and deduplicate products
    const allProductsMap = new Map();
    [...matchingProducts, ...variantProducts].forEach((product) => {
      allProductsMap.set(product.id, product);
    });

    const allProducts = Array.from(allProductsMap.values());

    // Get all variants and categories for these products
    const productIds = allProducts.map((p) => p.id);

    const variants = productIds.length > 0
      ? await db
          .select()
          .from(productVariants)
          .where(sql`${productVariants.productId} IN ${productIds}`)
      : [];

    const categoryIds = [...new Set(allProducts.map((p) => p.categoryId).filter(Boolean))];
    const categoriesData = categoryIds.length > 0
      ? await db
          .select()
          .from(categories)
          .where(sql`${categories.id} IN ${categoryIds}`)
      : [];

    const categoriesMap = new Map(categoriesData.map((c) => [c.id, c]));

    // Build result with variants
    const result = allProducts.map((product) => {
      const productVariantsList = variants.filter((v) => v.productId === product.id);
      const category = product.categoryId ? categoriesMap.get(product.categoryId) : null;

      const totalStock = productVariantsList.reduce(
        (sum, v) => sum + (v.stockQuantity || 0),
        0
      );

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: product.basePrice,
        images: product.images,
        categoryId: product.categoryId,
        category: category
          ? {
              id: category.id,
              name: category.name,
              slug: category.slug,
            }
          : null,
        variants: productVariantsList.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          stockQuantity: v.stockQuantity,
          additionalPrice: v.additionalPrice,
        })),
        totalStock,
        variantCount: productVariantsList.length,
      };
    });

    // Sort by relevance (name match first, then by stock)
    result.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase());
      const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase());

      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;

      return b.totalStock - a.totalStock;
    });

    return NextResponse.json({ products: result.slice(0, 10) });
  } catch (error) {
    console.error("POS product search error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche de produits" },
      { status: 500 }
    );
  }
}
