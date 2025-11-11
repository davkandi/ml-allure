import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, customers } from '@/db/schema';
import { eq, like, and, or, desc, gte, lte } from 'drizzle-orm';

const ORDER_NUMBER_REGEX = /^MLA-\d{8}-\d{4}$/;

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const VALID_PAYMENT_METHODS = ['MOBILE_MONEY', 'CASH_ON_DELIVERY'];
const VALID_PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
const VALID_DELIVERY_METHODS = ['HOME_DELIVERY', 'STORE_PICKUP'];
const VALID_SOURCES = ['ONLINE', 'IN_STORE'];

function validateOrderNumber(orderNumber: string): boolean {
  return ORDER_NUMBER_REGEX.test(orderNumber);
}

function validateDeliveryAddress(address: any): boolean {
  if (!address) return true;
  try {
    if (typeof address === 'string') {
      JSON.parse(address);
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');

    if (id || orderNumber) {
      let whereCondition;
      
      if (id) {
        if (isNaN(parseInt(id))) {
          return NextResponse.json({ 
            error: "Valid ID is required",
            code: "INVALID_ID" 
          }, { status: 400 });
        }
        whereCondition = eq(orders.id, parseInt(id));
      } else if (orderNumber) {
        whereCondition = eq(orders.orderNumber, orderNumber);
      }

      const order = await db.select()
        .from(orders)
        .where(whereCondition)
        .limit(1);

      if (order.length === 0) {
        return NextResponse.json({ 
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(order[0]);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const source = searchParams.get('source');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db.select().from(orders);
    const conditions = [];

    if (search) {
      conditions.push(like(orders.orderNumber, `%${search}%`));
    }

    if (customerId) {
      const customerIdInt = parseInt(customerId);
      if (!isNaN(customerIdInt)) {
        conditions.push(eq(orders.customerId, customerIdInt));
      }
    }

    if (status) {
      if (VALID_STATUSES.includes(status)) {
        conditions.push(eq(orders.status, status));
      }
    }

    if (paymentStatus) {
      if (VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
        conditions.push(eq(orders.paymentStatus, paymentStatus));
      }
    }

    if (source) {
      if (VALID_SOURCES.includes(source)) {
        conditions.push(eq(orders.source, source));
      }
    }

    if (startDate) {
      const startTimestamp = parseInt(startDate);
      if (!isNaN(startTimestamp)) {
        conditions.push(gte(orders.createdAt, startTimestamp));
      }
    }

    if (endDate) {
      const endTimestamp = parseInt(endDate);
      if (!isNaN(endTimestamp)) {
        conditions.push(lte(orders.createdAt, endTimestamp));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(orders.createdAt))
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
    const {
      orderNumber,
      customerId,
      status,
      paymentMethod,
      paymentStatus,
      deliveryMethod,
      deliveryFee,
      subtotal,
      total,
      source,
      paymentReference,
      deliveryAddress,
      deliveryZone,
      notes,
      completedAt
    } = body;

    if (!orderNumber) {
      return NextResponse.json({ 
        error: "Order number is required",
        code: "MISSING_ORDER_NUMBER" 
      }, { status: 400 });
    }

    if (!validateOrderNumber(orderNumber)) {
      return NextResponse.json({ 
        error: "Order number must match format 'MLA-YYYYMMDD-XXXX'",
        code: "INVALID_ORDER_NUMBER_FORMAT" 
      }, { status: 400 });
    }

    if (!customerId) {
      return NextResponse.json({ 
        error: "Customer ID is required",
        code: "MISSING_CUSTOMER_ID" 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: "Status is required",
        code: "MISSING_STATUS" 
      }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ 
        error: "Payment method is required",
        code: "MISSING_PAYMENT_METHOD" 
      }, { status: 400 });
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ 
        error: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
        code: "INVALID_PAYMENT_METHOD" 
      }, { status: 400 });
    }

    if (!paymentStatus) {
      return NextResponse.json({ 
        error: "Payment status is required",
        code: "MISSING_PAYMENT_STATUS" 
      }, { status: 400 });
    }

    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json({ 
        error: `Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`,
        code: "INVALID_PAYMENT_STATUS" 
      }, { status: 400 });
    }

    if (!deliveryMethod) {
      return NextResponse.json({ 
        error: "Delivery method is required",
        code: "MISSING_DELIVERY_METHOD" 
      }, { status: 400 });
    }

    if (!VALID_DELIVERY_METHODS.includes(deliveryMethod)) {
      return NextResponse.json({ 
        error: `Delivery method must be one of: ${VALID_DELIVERY_METHODS.join(', ')}`,
        code: "INVALID_DELIVERY_METHOD" 
      }, { status: 400 });
    }

    if (deliveryFee === undefined || deliveryFee === null) {
      return NextResponse.json({ 
        error: "Delivery fee is required",
        code: "MISSING_DELIVERY_FEE" 
      }, { status: 400 });
    }

    if (deliveryFee < 0) {
      return NextResponse.json({ 
        error: "Delivery fee must be a non-negative number",
        code: "INVALID_DELIVERY_FEE" 
      }, { status: 400 });
    }

    if (subtotal === undefined || subtotal === null) {
      return NextResponse.json({ 
        error: "Subtotal is required",
        code: "MISSING_SUBTOTAL" 
      }, { status: 400 });
    }

    if (subtotal < 0) {
      return NextResponse.json({ 
        error: "Subtotal must be a non-negative number",
        code: "INVALID_SUBTOTAL" 
      }, { status: 400 });
    }

    if (total === undefined || total === null) {
      return NextResponse.json({ 
        error: "Total is required",
        code: "MISSING_TOTAL" 
      }, { status: 400 });
    }

    if (total < 0) {
      return NextResponse.json({ 
        error: "Total must be a non-negative number",
        code: "INVALID_TOTAL" 
      }, { status: 400 });
    }

    if (!source) {
      return NextResponse.json({ 
        error: "Source is required",
        code: "MISSING_SOURCE" 
      }, { status: 400 });
    }

    if (!VALID_SOURCES.includes(source)) {
      return NextResponse.json({ 
        error: `Source must be one of: ${VALID_SOURCES.join(', ')}`,
        code: "INVALID_SOURCE" 
      }, { status: 400 });
    }

    if (deliveryAddress && !validateDeliveryAddress(deliveryAddress)) {
      return NextResponse.json({ 
        error: "Delivery address must be valid JSON",
        code: "INVALID_DELIVERY_ADDRESS" 
      }, { status: 400 });
    }

    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (existingOrder.length > 0) {
      return NextResponse.json({ 
        error: "Order number already exists",
        code: "DUPLICATE_ORDER_NUMBER" 
      }, { status: 400 });
    }

    const customer = await db.select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ 
        error: "Customer not found",
        code: "CUSTOMER_NOT_FOUND" 
      }, { status: 400 });
    }

    const now = Date.now();

    const insertData: any = {
      orderNumber: orderNumber.trim(),
      customerId,
      status,
      paymentMethod,
      paymentStatus,
      deliveryMethod,
      deliveryFee,
      subtotal,
      total,
      source,
      createdAt: now,
      updatedAt: now
    };

    if (paymentReference !== undefined && paymentReference !== null) {
      insertData.paymentReference = paymentReference;
    }

    if (deliveryAddress !== undefined && deliveryAddress !== null) {
      insertData.deliveryAddress = typeof deliveryAddress === 'string' 
        ? deliveryAddress 
        : JSON.stringify(deliveryAddress);
    }

    if (deliveryZone !== undefined && deliveryZone !== null) {
      insertData.deliveryZone = deliveryZone;
    }

    if (notes !== undefined && notes !== null) {
      insertData.notes = notes;
    }

    if (completedAt !== undefined && completedAt !== null) {
      insertData.completedAt = completedAt;
    }

    const newOrder = await db.insert(orders)
      .values(insertData)
      .returning();

    return NextResponse.json(newOrder[0], { status: 201 });
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

    if (body.createdAt !== undefined) {
      return NextResponse.json({ 
        error: "Cannot update createdAt field",
        code: "CANNOT_UPDATE_CREATED_AT" 
      }, { status: 400 });
    }

    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND' 
      }, { status: 404 });
    }

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    if (body.paymentMethod && !VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json({ 
        error: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
        code: "INVALID_PAYMENT_METHOD" 
      }, { status: 400 });
    }

    if (body.paymentStatus && !VALID_PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return NextResponse.json({ 
        error: `Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`,
        code: "INVALID_PAYMENT_STATUS" 
      }, { status: 400 });
    }

    if (body.deliveryMethod && !VALID_DELIVERY_METHODS.includes(body.deliveryMethod)) {
      return NextResponse.json({ 
        error: `Delivery method must be one of: ${VALID_DELIVERY_METHODS.join(', ')}`,
        code: "INVALID_DELIVERY_METHOD" 
      }, { status: 400 });
    }

    if (body.source && !VALID_SOURCES.includes(body.source)) {
      return NextResponse.json({ 
        error: `Source must be one of: ${VALID_SOURCES.join(', ')}`,
        code: "INVALID_SOURCE" 
      }, { status: 400 });
    }

    if (body.deliveryFee !== undefined && body.deliveryFee < 0) {
      return NextResponse.json({ 
        error: "Delivery fee must be a non-negative number",
        code: "INVALID_DELIVERY_FEE" 
      }, { status: 400 });
    }

    if (body.subtotal !== undefined && body.subtotal < 0) {
      return NextResponse.json({ 
        error: "Subtotal must be a non-negative number",
        code: "INVALID_SUBTOTAL" 
      }, { status: 400 });
    }

    if (body.total !== undefined && body.total < 0) {
      return NextResponse.json({ 
        error: "Total must be a non-negative number",
        code: "INVALID_TOTAL" 
      }, { status: 400 });
    }

    if (body.deliveryAddress && !validateDeliveryAddress(body.deliveryAddress)) {
      return NextResponse.json({ 
        error: "Delivery address must be valid JSON",
        code: "INVALID_DELIVERY_ADDRESS" 
      }, { status: 400 });
    }

    if (body.orderNumber) {
      if (!validateOrderNumber(body.orderNumber)) {
        return NextResponse.json({ 
          error: "Order number must match format 'MLA-YYYYMMDD-XXXX'",
          code: "INVALID_ORDER_NUMBER_FORMAT" 
        }, { status: 400 });
      }

      if (body.orderNumber !== existingOrder[0].orderNumber) {
        const duplicateCheck = await db.select()
          .from(orders)
          .where(eq(orders.orderNumber, body.orderNumber))
          .limit(1);

        if (duplicateCheck.length > 0) {
          return NextResponse.json({ 
            error: "Order number already exists",
            code: "DUPLICATE_ORDER_NUMBER" 
          }, { status: 400 });
        }
      }
    }

    if (body.customerId) {
      const customer = await db.select()
        .from(customers)
        .where(eq(customers.id, body.customerId))
        .limit(1);

      if (customer.length === 0) {
        return NextResponse.json({ 
          error: "Customer not found",
          code: "CUSTOMER_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    const updateData: any = {
      ...body,
      updatedAt: Date.now()
    };

    if (body.deliveryAddress !== undefined) {
      updateData.deliveryAddress = typeof body.deliveryAddress === 'string'
        ? body.deliveryAddress
        : JSON.stringify(body.deliveryAddress);
    }

    if (body.status && (body.status === 'DELIVERED' || body.status === 'CANCELLED')) {
      if (!existingOrder[0].completedAt) {
        updateData.completedAt = Date.now();
      }
    }

    const updated = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, parseInt(id)))
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

    const existingOrder = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND' 
      }, { status: 404 });
    }

    const now = Date.now();
    const deleted = await db.update(orders)
      .set({
        status: 'CANCELLED',
        updatedAt: now,
        completedAt: existingOrder[0].completedAt || now
      })
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}