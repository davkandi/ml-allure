import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { refunds, orders, customers } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth, requireRoles, createAuthErrorResponse } from '@/lib/auth';

const VALID_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
const VALID_METHODS = ['MOBILE_MONEY', 'CASH', 'STORE_CREDIT'];

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

  // Only admins and staff can view all refunds
  if (!['ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'].includes(user.role)) {
    return createAuthErrorResponse(
      'Insufficient permissions to view refunds',
      403
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get specific refund by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid refund ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const refund = await db.select()
        .from(refunds)
        .where(eq(refunds.id, parseInt(id)))
        .limit(1);

      if (refund.length === 0) {
        return NextResponse.json({
          error: 'Refund not found',
          code: 'REFUND_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(refund[0]);
    }

    // List refunds with filters
    let query = db.select().from(refunds);
    const conditions = [];

    if (orderId) {
      const orderIdInt = parseInt(orderId);
      if (!isNaN(orderIdInt)) {
        conditions.push(eq(refunds.orderId, orderIdInt));
      }
    }

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(refunds.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(refunds.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET refunds error:', error);
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

  // Only admins can update refunds
  if (user.role !== 'ADMIN') {
    return createAuthErrorResponse(
      'Only administrators can update refunds',
      403
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid refund ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();

    // Fetch existing refund
    const existingRefund = await db.select()
      .from(refunds)
      .where(eq(refunds.id, parseInt(id)))
      .limit(1);

    if (existingRefund.length === 0) {
      return NextResponse.json({
        error: 'Refund not found',
        code: 'REFUND_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Validate refund method if provided
    if (body.refundMethod && !VALID_METHODS.includes(body.refundMethod)) {
      return NextResponse.json({
        error: `Refund method must be one of: ${VALID_METHODS.join(', ')}`,
        code: 'INVALID_METHOD'
      }, { status: 400 });
    }

    const now = Date.now();
    const updateData: any = {
      ...body,
      updatedAt: now,
    };

    // If status is changing to COMPLETED, set processedAt
    if (body.status === 'COMPLETED' && !existingRefund[0].processedAt) {
      updateData.processedAt = now;
      updateData.processedBy = user.id;
    }

    const updated = await db.update(refunds)
      .set(updateData)
      .where(eq(refunds.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT refunds error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}
