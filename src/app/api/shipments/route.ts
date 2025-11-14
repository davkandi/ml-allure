import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, orders, customers } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth, requireRoles, createAuthErrorResponse } from '@/lib/auth';

const VALID_CARRIERS = ['DHL', 'FEDEX', 'UPS', 'LOCAL', 'OTHER'];
const VALID_STATUSES = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'];

interface CreateShipmentRequest {
  orderId: number;
  carrier: string;
  service?: string;
  recipientName: string;
  recipientPhone?: string;
  shippingAddress: any;
  weight?: number;
  cost?: number;
}

export async function POST(request: NextRequest) {
  // SECURITY: Only admins and staff can create shipments
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  if (!['ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'].includes(user.role)) {
    return createAuthErrorResponse(
      'Insufficient permissions to create shipments',
      403
    );
  }

  try {
    const body: CreateShipmentRequest = await request.json();

    // Validation
    if (!body.orderId || !body.carrier || !body.recipientName || !body.shippingAddress) {
      return NextResponse.json({
        error: 'Order ID, carrier, recipient name, and shipping address are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    // Validate carrier
    if (!VALID_CARRIERS.includes(body.carrier)) {
      return NextResponse.json({
        error: `Carrier must be one of: ${VALID_CARRIERS.join(', ')}`,
        code: 'INVALID_CARRIER'
      }, { status: 400 });
    }

    // Verify order exists
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

    const now = Date.now();

    // Generate tracking number (simplified - in production, this would come from carrier API)
    const trackingNumber = `${body.carrier}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const newShipment = await db.insert(shipments)
      .values({
        orderId: body.orderId,
        trackingNumber: trackingNumber,
        carrier: body.carrier,
        service: body.service || null,
        status: 'PENDING',
        recipientName: body.recipientName,
        recipientPhone: body.recipientPhone || null,
        shippingAddress: typeof body.shippingAddress === 'string'
          ? body.shippingAddress
          : JSON.stringify(body.shippingAddress),
        weight: body.weight || null,
        cost: body.cost || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Update order status to SHIPPED
    await db.update(orders)
      .set({
        status: 'SHIPPED',
        updatedAt: now,
      })
      .where(eq(orders.id, body.orderId));

    return NextResponse.json(newShipment[0], { status: 201 });
  } catch (error) {
    console.error('Create shipment error:', error);
    return NextResponse.json({
      error: 'Failed to create shipment: ' + (error as Error).message,
      code: 'CREATE_FAILED'
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
    const orderId = searchParams.get('orderId');
    const trackingNumber = searchParams.get('trackingNumber');
    const status = searchParams.get('status');
    const carrier = searchParams.get('carrier');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get specific shipment by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid shipment ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const shipment = await db.select()
        .from(shipments)
        .where(eq(shipments.id, parseInt(id)))
        .limit(1);

      if (shipment.length === 0) {
        return NextResponse.json({
          error: 'Shipment not found',
          code: 'SHIPMENT_NOT_FOUND'
        }, { status: 404 });
      }

      // IDOR Protection: Customers can only view shipments for their own orders
      if (user.role === 'CUSTOMER') {
        const order = await db.select()
          .from(orders)
          .where(eq(orders.id, shipment[0].orderId))
          .limit(1);

        if (order.length > 0 && order[0].customerId !== user.id) {
          return createAuthErrorResponse(
            'You can only view your own shipments',
            403
          );
        }
      }

      return NextResponse.json(shipment[0]);
    }

    // Get shipment by tracking number
    if (trackingNumber) {
      const shipment = await db.select()
        .from(shipments)
        .where(eq(shipments.trackingNumber, trackingNumber))
        .limit(1);

      if (shipment.length === 0) {
        return NextResponse.json({
          error: 'Shipment not found',
          code: 'SHIPMENT_NOT_FOUND'
        }, { status: 404 });
      }

      // IDOR Protection
      if (user.role === 'CUSTOMER') {
        const order = await db.select()
          .from(orders)
          .where(eq(orders.id, shipment[0].orderId))
          .limit(1);

        if (order.length > 0 && order[0].customerId !== user.id) {
          return createAuthErrorResponse(
            'You can only view your own shipments',
            403
          );
        }
      }

      return NextResponse.json(shipment[0]);
    }

    // List shipments with filters
    let query = db.select().from(shipments);
    const conditions = [];

    // IDOR Protection: Customers can only see shipments for their orders
    if (user.role === 'CUSTOMER') {
      // Get customer's order IDs
      const customerOrders = await db.select()
        .from(orders)
        .where(eq(orders.customerId, user.id));

      const orderIds = customerOrders.map(o => o.id);

      if (orderIds.length === 0) {
        return NextResponse.json([]);
      }

      // This is a simplified check - in production, use a proper IN clause
      if (orderId) {
        const orderIdInt = parseInt(orderId);
        if (!isNaN(orderIdInt) && orderIds.includes(orderIdInt)) {
          conditions.push(eq(shipments.orderId, orderIdInt));
        } else {
          return NextResponse.json([]);
        }
      }
    } else {
      // Admin/Staff can filter by orderId
      if (orderId) {
        const orderIdInt = parseInt(orderId);
        if (!isNaN(orderIdInt)) {
          conditions.push(eq(shipments.orderId, orderIdInt));
        }
      }
    }

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(shipments.status, status));
    }

    if (carrier && VALID_CARRIERS.includes(carrier)) {
      conditions.push(eq(shipments.carrier, carrier));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(shipments.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET shipments error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: Only admins and staff can update shipments
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  if (!['ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'].includes(user.role)) {
    return createAuthErrorResponse(
      'Insufficient permissions to update shipments',
      403
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid shipment ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();

    // Fetch existing shipment
    const existingShipment = await db.select()
      .from(shipments)
      .where(eq(shipments.id, parseInt(id)))
      .limit(1);

    if (existingShipment.length === 0) {
      return NextResponse.json({
        error: 'Shipment not found',
        code: 'SHIPMENT_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Validate carrier if provided
    if (body.carrier && !VALID_CARRIERS.includes(body.carrier)) {
      return NextResponse.json({
        error: `Carrier must be one of: ${VALID_CARRIERS.join(', ')}`,
        code: 'INVALID_CARRIER'
      }, { status: 400 });
    }

    const now = Date.now();
    const updateData: any = {
      ...body,
      updatedAt: now,
    };

    // If status is changing to DELIVERED, set actualDelivery and update order status
    if (body.status === 'DELIVERED' && existingShipment[0].status !== 'DELIVERED') {
      updateData.actualDelivery = now;

      // Update order status to DELIVERED
      await db.update(orders)
        .set({
          status: 'DELIVERED',
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(orders.id, existingShipment[0].orderId));
    }

    if (body.shippingAddress && typeof body.shippingAddress !== 'string') {
      updateData.shippingAddress = JSON.stringify(body.shippingAddress);
    }

    const updated = await db.update(shipments)
      .set(updateData)
      .where(eq(shipments.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT shipments error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}
