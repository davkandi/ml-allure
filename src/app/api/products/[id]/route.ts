import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, productVariants, orderItems } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Get category
    let category = null;
    if (product[0].categoryId) {
      const categoryResult = await db.select()
        .from(categories)
        .where(eq(categories.id, product[0].categoryId))
        .limit(1);
      category = categoryResult[0] || null;
    }

    // Get variants
    const variants = await db.select()
      .from(productVariants)
      .where(eq(productVariants.productId, product[0].id));

    return NextResponse.json({
      success: true,
      product: {
        ...product[0],
        category,
        variants,
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product with variants
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      categoryId,
      basePrice,
      tags,
      images,
      isActive,
      isFeatured,
      variants: incomingVariants,
    } = body;

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Check if slug is taken by another product
    if (slug && slug !== existingProduct[0].slug) {
      const slugTaken = await db.select()
        .from(products)
        .where(and(
          eq(products.slug, slug),
          sql`${products.id} != ${productId}`
        ))
        .limit(1);

      if (slugTaken.length > 0) {
        return NextResponse.json(
          { success: false, message: "Slug is already taken" },
          { status: 400 }
        );
      }
    }

    // Get existing variants
    const existingVariants = await db.select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    const existingVariantIds = existingVariants.map((v) => v.id);
    const incomingVariantIds = incomingVariants
      .filter((v: any) => v.id && typeof v.id === 'number')
      .map((v: any) => v.id);

    // Determine which variants to delete
    const variantsToDelete = existingVariantIds.filter(
      (id) => !incomingVariantIds.includes(id)
    );

    const now = Date.now();

    // Delete removed variants
    if (variantsToDelete.length > 0) {
      await db.delete(productVariants)
        .where(sql`${productVariants.id} IN (${sql.join(variantsToDelete.map(id => sql`${id}`), sql`, `)})`);
    }

    // Update or create variants
    for (const variant of incomingVariants) {
      const isExistingVariant = variant.id && typeof variant.id === 'number';

      if (isExistingVariant) {
        // Update existing variant
        await db.update(productVariants)
          .set({
            size: variant.size,
            color: variant.color,
            colorHex: variant.colorHex,
            stockQuantity: parseInt(variant.stockQuantity) || 0,
            additionalPrice: parseFloat(variant.additionalPrice) || 0,
            updatedAt: now,
          })
          .where(eq(productVariants.id, variant.id));
      } else {
        // Create new variant
        const sku = `${slug.toUpperCase()}-${variant.size}-${variant.color
          .substring(0, 3)
          .toUpperCase()}-${Date.now()}`;

        await db.insert(productVariants).values({
          productId,
          sku,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          stockQuantity: parseInt(variant.stockQuantity) || 0,
          additionalPrice: parseFloat(variant.additionalPrice) || 0,
          isActive: 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Update product
    const updates: any = {
      updatedAt: now,
    };

    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description || null;
    if (categoryId !== undefined) updates.categoryId = categoryId ? parseInt(categoryId) : null;
    if (basePrice !== undefined) updates.basePrice = parseFloat(basePrice);
    if (tags !== undefined) updates.tags = JSON.stringify(tags);
    if (images !== undefined) updates.images = JSON.stringify(images);
    if (isActive !== undefined) updates.isActive = isActive ? 1 : 0;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured ? 1 : 0;

    await db.update(products)
      .set(updates)
      .where(eq(products.id, productId));

    // Fetch updated product with variants
    const updatedProduct = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    const updatedVariants = await db.select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: {
        ...updatedProduct[0],
        variants: updatedVariants,
      },
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Partial update (status toggle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (body.isActive !== undefined) {
      updates.isActive = body.isActive ? 1 : 0;
    }

    if (body.isFeatured !== undefined) {
      updates.isFeatured = body.isFeatured ? 1 : 0;
    }

    await db.update(products)
      .set(updates)
      .where(eq(products.id, productId));

    const updatedProduct = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct[0],
    });
  } catch (error) {
    console.error("Patch product error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Check if product has been ordered
    const orders = await db.select()
      .from(orderItems)
      .where(eq(orderItems.productId, productId))
      .limit(1);

    if (orders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete product with existing orders. Consider deactivating it instead.",
        },
        { status: 400 }
      );
    }

    // Delete variants first (if not cascading)
    await db.delete(productVariants)
      .where(eq(productVariants.productId, productId));

    // Delete product
    await db.delete(products)
      .where(eq(products.id, productId));

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
}