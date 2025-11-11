import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { productVariants } from '@/db/schema';
import { eq, like, and, or, desc, asc, gt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const sku = searchParams.get('sku');

    // Single record fetch by ID or SKU
    if (id || sku) {
      let whereCondition;
      
      if (id) {
        if (isNaN(parseInt(id))) {
          return NextResponse.json({ 
            error: "Valid ID is required",
            code: "INVALID_ID" 
          }, { status: 400 });
        }
        whereCondition = eq(productVariants.id, parseInt(id));
      } else if (sku) {
        whereCondition = eq(productVariants.sku, sku);
      }

      const variant = await db.select()
        .from(productVariants)
        .where(whereCondition)
        .limit(1);

      if (variant.length === 0) {
        return NextResponse.json({ 
          error: 'Product variant not found',
          code: 'VARIANT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(variant[0]);
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const productId = searchParams.get('productId');
    const isActiveParam = searchParams.get('isActive');
    const size = searchParams.get('size');
    const color = searchParams.get('color');
    const inStockParam = searchParams.get('inStock');

    const conditions = [];

    if (productId) {
      if (isNaN(parseInt(productId))) {
        return NextResponse.json({ 
          error: "Valid productId is required",
          code: "INVALID_PRODUCT_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(productVariants.productId, parseInt(productId)));
    }

    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true' ? 1 : 0;
      conditions.push(eq(productVariants.isActive, isActive));
    }

    if (size) {
      conditions.push(eq(productVariants.size, size));
    }

    if (color) {
      conditions.push(eq(productVariants.color, color));
    }

    if (inStockParam === 'true') {
      conditions.push(gt(productVariants.stockQuantity, 0));
    }

    let query = db.select().from(productVariants);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(productVariants.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, sku, size, color, colorHex, stockQuantity, additionalPrice, isActive } = body;

    // Validation: Required fields
    if (!productId) {
      return NextResponse.json({ 
        error: "productId is required",
        code: "MISSING_PRODUCT_ID" 
      }, { status: 400 });
    }

    if (!sku) {
      return NextResponse.json({ 
        error: "sku is required",
        code: "MISSING_SKU" 
      }, { status: 400 });
    }

    if (stockQuantity === undefined || stockQuantity === null) {
      return NextResponse.json({ 
        error: "stockQuantity is required",
        code: "MISSING_STOCK_QUANTITY" 
      }, { status: 400 });
    }

    // Validation: SKU format
    const skuRegex = /^MLA-\d+-\d+$/;
    if (!skuRegex.test(sku)) {
      return NextResponse.json({ 
        error: "sku must match format: MLA-{number}-{number}",
        code: "INVALID_SKU_FORMAT" 
      }, { status: 400 });
    }

    // Validation: Check SKU uniqueness
    const existingSku = await db.select()
      .from(productVariants)
      .where(eq(productVariants.sku, sku))
      .limit(1);

    if (existingSku.length > 0) {
      return NextResponse.json({ 
        error: "sku must be unique",
        code: "DUPLICATE_SKU" 
      }, { status: 400 });
    }

    // Validation: stockQuantity must be non-negative integer
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return NextResponse.json({ 
        error: "stockQuantity must be a non-negative integer",
        code: "INVALID_STOCK_QUANTITY" 
      }, { status: 400 });
    }

    // Validation: additionalPrice must be non-negative number
    const priceValue = additionalPrice !== undefined ? additionalPrice : 0;
    if (typeof priceValue !== 'number' || priceValue < 0) {
      return NextResponse.json({ 
        error: "additionalPrice must be a non-negative number",
        code: "INVALID_ADDITIONAL_PRICE" 
      }, { status: 400 });
    }

    // Validation: colorHex format
    if (colorHex) {
      const colorHexRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorHexRegex.test(colorHex)) {
        return NextResponse.json({ 
          error: "colorHex must match format: #RRGGBB",
          code: "INVALID_COLOR_HEX" 
        }, { status: 400 });
      }
    }

    // Validation: isActive must be boolean
    const isActiveValue = isActive !== undefined ? (isActive ? 1 : 0) : 1;
    if (isActive !== undefined && typeof isActive !== 'boolean' && isActive !== 0 && isActive !== 1) {
      return NextResponse.json({ 
        error: "isActive must be a boolean value",
        code: "INVALID_IS_ACTIVE" 
      }, { status: 400 });
    }

    const now = Date.now();

    const newVariant = await db.insert(productVariants)
      .values({
        productId,
        sku: sku.trim(),
        size: size ? size.trim() : null,
        color: color ? color.trim() : null,
        colorHex: colorHex ? colorHex.trim() : null,
        stockQuantity,
        additionalPrice: priceValue,
        isActive: isActiveValue,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newVariant[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { sku, size, color, colorHex, stockQuantity, additionalPrice, isActive, productId } = body;

    // Check if variant exists
    const existing = await db.select()
      .from(productVariants)
      .where(eq(productVariants.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Product variant not found',
        code: 'VARIANT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validation: SKU format if being changed
    if (sku) {
      const skuRegex = /^MLA-\d+-\d+$/;
      if (!skuRegex.test(sku)) {
        return NextResponse.json({ 
          error: "sku must match format: MLA-{number}-{number}",
          code: "INVALID_SKU_FORMAT" 
        }, { status: 400 });
      }

      // Check SKU uniqueness if being changed
      if (sku !== existing[0].sku) {
        const existingSku = await db.select()
          .from(productVariants)
          .where(eq(productVariants.sku, sku))
          .limit(1);

        if (existingSku.length > 0) {
          return NextResponse.json({ 
            error: "sku must be unique",
            code: "DUPLICATE_SKU" 
          }, { status: 400 });
        }
      }
    }

    // Validation: stockQuantity if being changed
    if (stockQuantity !== undefined) {
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        return NextResponse.json({ 
          error: "stockQuantity must be a non-negative integer",
          code: "INVALID_STOCK_QUANTITY" 
        }, { status: 400 });
      }
    }

    // Validation: additionalPrice if being changed
    if (additionalPrice !== undefined) {
      if (typeof additionalPrice !== 'number' || additionalPrice < 0) {
        return NextResponse.json({ 
          error: "additionalPrice must be a non-negative number",
          code: "INVALID_ADDITIONAL_PRICE" 
        }, { status: 400 });
      }
    }

    // Validation: colorHex format if being changed
    if (colorHex) {
      const colorHexRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorHexRegex.test(colorHex)) {
        return NextResponse.json({ 
          error: "colorHex must match format: #RRGGBB",
          code: "INVALID_COLOR_HEX" 
        }, { status: 400 });
      }
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (productId !== undefined) updates.productId = productId;
    if (sku !== undefined) updates.sku = sku.trim();
    if (size !== undefined) updates.size = size ? size.trim() : null;
    if (color !== undefined) updates.color = color ? color.trim() : null;
    if (colorHex !== undefined) updates.colorHex = colorHex ? colorHex.trim() : null;
    if (stockQuantity !== undefined) updates.stockQuantity = stockQuantity;
    if (additionalPrice !== undefined) updates.additionalPrice = additionalPrice;
    if (isActive !== undefined) updates.isActive = isActive ? 1 : 0;

    const updated = await db.update(productVariants)
      .set(updates)
      .where(eq(productVariants.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if variant exists
    const existing = await db.select()
      .from(productVariants)
      .where(eq(productVariants.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Product variant not found',
        code: 'VARIANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(productVariants)
      .where(eq(productVariants.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Product variant deleted successfully',
      variant: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}