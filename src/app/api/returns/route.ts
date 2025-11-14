import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { returns, returnItems, orders, orderItems, refunds, productVariants, inventoryLogs } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth, requireRoles, createAuthErrorResponse } from '@/lib/auth';

const VALID_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'COMPLETED'];
const VALID_CONDITIONS = ['UNOPENED', 'OPENED_UNUSED', 'DEFECTIVE', 'DAMAGED'];

interface CreateReturnRequest {
  orderId: number;
  reason: string;
  description?: string;
  items: Array<{
    orderItemId: number;
    quantity: number;
    condition: string;
    restockable?: boolean;
  }>;
}

// Generate RMA number in format: RMA-YYYYMMDD-XXXX
function generateRMANumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RMA-${year}${month}${day}-${random}`;
}

export async function POST(request: NextRequest) {
  // SECURITY: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  try {
    const body: CreateReturnRequest = await request.json();

    // Validation
    if (!body.orderId) {
      return NextResponse.json({
        error: 'Order ID is required',
        code: 'MISSING_ORDER_ID'
      }, { status: 400 });
    }

    if (!body.reason) {
      return NextResponse.json({
        error: 'Return reason is required',
        code: 'MISSING_REASON'
      }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({
        error: 'At least one item must be included in the return',
        code: 'MISSING_ITEMS'
      }, { status: 400 });
    }

    // Validate all items
    for (const item of body.items) {
      if (!item.orderItemId || !item.quantity || !item.condition) {
        return NextResponse.json({
          error: 'Each item must have orderItemId, quantity, and condition',
          code: 'INVALID_ITEM'
        }, { status: 400 });
      }

      if (!VALID_CONDITIONS.includes(item.condition)) {
        return NextResponse.json({
          error: `Item condition must be one of: ${VALID_CONDITIONS.join(', ')}`,
          code: 'INVALID_CONDITION'
        }, { status: 400 });
      }
    }

    // Fetch the order
    const order = await db.select()
      .from(orders)
      .where(eq(orders.id, body.orderId))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }, { status: 404 });
    }

    const currentOrder = order[0];

    // IDOR Protection: Customers can only create returns for their own orders
    if (user.role === 'CUSTOMER' && currentOrder.customerId !== user.id) {
      return createAuthErrorResponse(
        'You can only create returns for your own orders',
        403
      );
    }

    // Check if order is delivered (can only return delivered orders)
    if (currentOrder.status !== 'DELIVERED') {
      return NextResponse.json({
        error: 'Can only create returns for delivered orders',
        code: 'ORDER_NOT_DELIVERED'
      }, { status: 400 });
    }

    // Verify all order items belong to this order
    const orderItemIds = body.items.map(item => item.orderItemId);
    const items = await db.select()
      .from(orderItems)
      .where(eq(orderItems.orderId, body.orderId));

    const validItemIds = items.map(item => item.id);
    const invalidItems = orderItemIds.filter(id => !validItemIds.includes(id));

    if (invalidItems.length > 0) {
      return NextResponse.json({
        error: `Invalid order item IDs: ${invalidItems.join(', ')}`,
        code: 'INVALID_ORDER_ITEMS'
      }, { status: 400 });
    }

    const now = Date.now();
    const rmaNumber = generateRMANumber();

    // Create return record
    const newReturn = await db.insert(returns)
      .values({
        rmaNumber: rmaNumber,
        orderId: body.orderId,
        customerId: currentOrder.customerId,
        status: 'REQUESTED',
        reason: body.reason,
        description: body.description || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create return items
    const returnItemsData = body.items.map(item => ({
      returnId: newReturn[0].id,
      orderItemId: item.orderItemId,
      variantId: items.find(oi => oi.id === item.orderItemId)?.variantId || 0,
      quantity: item.quantity,
      condition: item.condition,
      restockable: item.restockable ?? (item.condition === 'UNOPENED' || item.condition === 'OPENED_UNUSED'),
      createdAt: now,
    }));

    const createdReturnItems = await db.insert(returnItems)
      .values(returnItemsData)
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Return request created successfully',
      return: newReturn[0],
      items: createdReturnItems,
    }, { status: 201 });
  } catch (error) {
    console.error('Create return error:', error);
    return NextResponse.json({
      error: 'Failed to create return: ' + (error as Error).message,
      code: 'CREATE_RETURN_FAILED'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // SECURITY: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const rmaNumber = searchParams.get('rmaNumber');
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get specific return by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid return ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const returnRecord = await db.select()
        .from(returns)
        .where(eq(returns.id, parseInt(id)))
        .limit(1);

      if (returnRecord.length === 0) {
        return NextResponse.json({
          error: 'Return not found',
          code: 'RETURN_NOT_FOUND'
        }, { status: 404 });
      }

      // IDOR Protection: Customers can only view their own returns
      if (user.role === 'CUSTOMER' && returnRecord[0].customerId !== user.id) {
        return createAuthErrorResponse(
          'You can only view your own returns',
          403
        );
      }

      // Fetch return items
      const items = await db.select()
        .from(returnItems)
        .where(eq(returnItems.returnId, returnRecord[0].id));

      return NextResponse.json({
        ...returnRecord[0],
        items,
      });
    }

    // Get return by RMA number
    if (rmaNumber) {
      const returnRecord = await db.select()
        .from(returns)
        .where(eq(returns.rmaNumber, rmaNumber))
        .limit(1);

      if (returnRecord.length === 0) {
        return NextResponse.json({
          error: 'Return not found',
          code: 'RETURN_NOT_FOUND'
        }, { status: 404 });
      }

      // IDOR Protection
      if (user.role === 'CUSTOMER' && returnRecord[0].customerId !== user.id) {
        return createAuthErrorResponse(
          'You can only view your own returns',
          403
        );
      }

      const items = await db.select()
        .from(returnItems)
        .where(eq(returnItems.returnId, returnRecord[0].id));

      return NextResponse.json({
        ...returnRecord[0],
        items,
      });
    }

    // List returns with filters
    let query = db.select().from(returns);
    const conditions = [];

    // IDOR Protection: Customers can only see their own returns
    if (user.role === 'CUSTOMER') {
      conditions.push(eq(returns.customerId, user.id));
    }

    if (orderId) {
      const orderIdInt = parseInt(orderId);
      if (!isNaN(orderIdInt)) {
        conditions.push(eq(returns.orderId, orderIdInt));
      }
    }

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(returns.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(returns.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET returns error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  // Only admins and staff can update returns
  if (!['ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'].includes(user.role)) {
    return createAuthErrorResponse(
      'Insufficient permissions to update returns',
      403
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid return ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();

    // Fetch existing return
    const existingReturn = await db.select()
      .from(returns)
      .where(eq(returns.id, parseInt(id)))
      .limit(1);

    if (existingReturn.length === 0) {
      return NextResponse.json({
        error: 'Return not found',
        code: 'RETURN_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    const now = Date.now();
    const updateData: any = {
      ...body,
      updatedAt: now,
    };

    // Handle status transitions
    if (body.status) {
      if (body.status === 'APPROVED' && !existingReturn[0].approvedAt) {
        updateData.approvedAt = now;
        updateData.approvedBy = user.id;
      } else if (body.status === 'RECEIVED' && !existingReturn[0].receivedAt) {
        updateData.receivedAt = now;
        updateData.receivedBy = user.id;

        // Restock items if they are restockable
        const items = await db.select()
          .from(returnItems)
          .where(eq(returnItems.returnId, existingReturn[0].id));

        for (const item of items) {
          if (item.restockable) {
            const variant = await db.select()
              .from(productVariants)
              .where(eq(productVariants.id, item.variantId))
              .limit(1);

            if (variant.length > 0) {
              const currentStock = variant[0].stockQuantity;
              const newStock = currentStock + item.quantity;

              await db.update(productVariants)
                .set({
                  stockQuantity: newStock,
                  updatedAt: now,
                })
                .where(eq(productVariants.id, item.variantId));

              await db.insert(inventoryLogs)
                .values({
                  variantId: item.variantId,
                  changeType: 'RETURN',
                  quantityChange: item.quantity,
                  previousQuantity: currentStock,
                  newQuantity: newStock,
                  reason: `RMA return received: ${existingReturn[0].rmaNumber}`,
                  performedBy: user.id,
                  orderId: existingReturn[0].orderId,
                  createdAt: now,
                });
            }
          }
        }
      }
    }

    const updated = await db.update(returns)
      .set(updateData)
      .where(eq(returns.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT returns error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}
