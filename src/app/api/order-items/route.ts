import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderItems, orders, products, productVariants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const orderItem = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, parseInt(id)))
        .limit(1);

      if (orderItem.length === 0) {
        return NextResponse.json(
          { error: 'Order item not found', code: 'ORDER_ITEM_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(orderItem[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const orderId = searchParams.get('orderId');
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');

    let query = db.select().from(orderItems);

    // Build filter conditions
    const conditions = [];
    
    if (orderId) {
      if (isNaN(parseInt(orderId))) {
        return NextResponse.json(
          { error: 'Valid orderId is required', code: 'INVALID_ORDER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(orderItems.orderId, parseInt(orderId)));
    }

    if (productId) {
      if (isNaN(parseInt(productId))) {
        return NextResponse.json(
          { error: 'Valid productId is required', code: 'INVALID_PRODUCT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(orderItems.productId, parseInt(productId)));
    }

    if (variantId) {
      if (isNaN(parseInt(variantId))) {
        return NextResponse.json(
          { error: 'Valid variantId is required', code: 'INVALID_VARIANT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(orderItems.variantId, parseInt(variantId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, productId, variantId, quantity, priceAtPurchase, productName, variantDetails } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required', code: 'MISSING_ORDER_ID' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required', code: 'MISSING_PRODUCT_ID' },
        { status: 400 }
      );
    }

    if (!variantId) {
      return NextResponse.json(
        { error: 'variantId is required', code: 'MISSING_VARIANT_ID' },
        { status: 400 }
      );
    }

    if (!quantity) {
      return NextResponse.json(
        { error: 'quantity is required', code: 'MISSING_QUANTITY' },
        { status: 400 }
      );
    }

    if (priceAtPurchase === undefined || priceAtPurchase === null) {
      return NextResponse.json(
        { error: 'priceAtPurchase is required', code: 'MISSING_PRICE_AT_PURCHASE' },
        { status: 400 }
      );
    }

    if (!productName) {
      return NextResponse.json(
        { error: 'productName is required', code: 'MISSING_PRODUCT_NAME' },
        { status: 400 }
      );
    }

    // Validate quantity is positive integer
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'quantity must be a positive integer greater than 0', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    // Validate priceAtPurchase is positive number
    if (typeof priceAtPurchase !== 'number' || priceAtPurchase <= 0) {
      return NextResponse.json(
        { error: 'priceAtPurchase must be a positive number greater than 0', code: 'INVALID_PRICE_AT_PURCHASE' },
        { status: 400 }
      );
    }

    // Validate variantDetails is valid JSON if provided
    if (variantDetails !== undefined && variantDetails !== null) {
      if (typeof variantDetails === 'string') {
        try {
          JSON.parse(variantDetails);
        } catch {
          return NextResponse.json(
            { error: 'variantDetails must be valid JSON', code: 'INVALID_VARIANT_DETAILS' },
            { status: 400 }
          );
        }
      } else if (typeof variantDetails !== 'object') {
        return NextResponse.json(
          { error: 'variantDetails must be valid JSON', code: 'INVALID_VARIANT_DETAILS' },
          { status: 400 }
        );
      }
    }

    // Verify foreign key references exist
    const orderExists = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderExists.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 400 }
      );
    }

    const productExists = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productExists.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 400 }
      );
    }

    const variantExists = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    if (variantExists.length === 0) {
      return NextResponse.json(
        { error: 'Product variant not found', code: 'VARIANT_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Create new order item
    const newOrderItem = await db
      .insert(orderItems)
      .values({
        orderId,
        productId,
        variantId,
        quantity,
        priceAtPurchase,
        productName: productName.trim(),
        variantDetails: variantDetails || null,
        createdAt: Date.now(),
      })
      .returning();

    return NextResponse.json(newOrderItem[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity, priceAtPurchase, productName, variantDetails } = body;

    // Check if order item exists
    const existingOrderItem = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, parseInt(id)))
      .limit(1);

    if (existingOrderItem.length === 0) {
      return NextResponse.json(
        { error: 'Order item not found', code: 'ORDER_ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate quantity if provided
    if (quantity !== undefined) {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: 'quantity must be a positive integer greater than 0', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }
    }

    // Validate priceAtPurchase if provided
    if (priceAtPurchase !== undefined) {
      if (typeof priceAtPurchase !== 'number' || priceAtPurchase <= 0) {
        return NextResponse.json(
          { error: 'priceAtPurchase must be a positive number greater than 0', code: 'INVALID_PRICE_AT_PURCHASE' },
          { status: 400 }
        );
      }
    }

    // Validate variantDetails if provided
    if (variantDetails !== undefined && variantDetails !== null) {
      if (typeof variantDetails === 'string') {
        try {
          JSON.parse(variantDetails);
        } catch {
          return NextResponse.json(
            { error: 'variantDetails must be valid JSON', code: 'INVALID_VARIANT_DETAILS' },
            { status: 400 }
          );
        }
      } else if (typeof variantDetails !== 'object') {
        return NextResponse.json(
          { error: 'variantDetails must be valid JSON', code: 'INVALID_VARIANT_DETAILS' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: any = {};
    
    if (quantity !== undefined) {
      updates.quantity = quantity;
    }
    
    if (priceAtPurchase !== undefined) {
      updates.priceAtPurchase = priceAtPurchase;
    }
    
    if (productName !== undefined) {
      updates.productName = productName.trim();
    }
    
    if (variantDetails !== undefined) {
      updates.variantDetails = variantDetails;
    }

    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingOrderItem[0], { status: 200 });
    }

    const updatedOrderItem = await db
      .update(orderItems)
      .set(updates)
      .where(eq(orderItems.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedOrderItem[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if order item exists
    const existingOrderItem = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, parseInt(id)))
      .limit(1);

    if (existingOrderItem.length === 0) {
      return NextResponse.json(
        { error: 'Order item not found', code: 'ORDER_ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(orderItems)
      .where(eq(orderItems.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Order item deleted successfully',
        deletedOrderItem: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}