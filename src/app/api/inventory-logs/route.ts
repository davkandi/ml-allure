import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inventoryLogs } from '@/db/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

const ALLOWED_CHANGE_TYPES = ['SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const log = await db
        .select()
        .from(inventoryLogs)
        .where(eq(inventoryLogs.id, parseInt(id)))
        .limit(1);

      if (log.length === 0) {
        return NextResponse.json(
          { error: 'Inventory log not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(log[0], { status: 200 });
    }

    // List with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const variantId = searchParams.get('variantId');
    const changeType = searchParams.get('changeType');
    const performedBy = searchParams.get('performedBy');
    const orderId = searchParams.get('orderId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    let query = db.select().from(inventoryLogs);

    const conditions = [];

    if (variantId) {
      const variantIdInt = parseInt(variantId);
      if (!isNaN(variantIdInt)) {
        conditions.push(eq(inventoryLogs.variantId, variantIdInt));
      }
    }

    if (changeType) {
      if (ALLOWED_CHANGE_TYPES.includes(changeType.toUpperCase())) {
        conditions.push(eq(inventoryLogs.changeType, changeType.toUpperCase()));
      }
    }

    if (performedBy) {
      const performedByInt = parseInt(performedBy);
      if (!isNaN(performedByInt)) {
        conditions.push(eq(inventoryLogs.performedBy, performedByInt));
      }
    }

    if (orderId) {
      const orderIdInt = parseInt(orderId);
      if (!isNaN(orderIdInt)) {
        conditions.push(eq(inventoryLogs.orderId, orderIdInt));
      }
    }

    if (startDate) {
      const startTimestamp = parseInt(startDate);
      if (!isNaN(startTimestamp)) {
        conditions.push(gte(inventoryLogs.createdAt, startTimestamp));
      }
    }

    if (endDate) {
      const endTimestamp = parseInt(endDate);
      if (!isNaN(endTimestamp)) {
        conditions.push(lte(inventoryLogs.createdAt, endTimestamp));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (sort === 'createdAt') {
      query = query.orderBy(order === 'asc' ? asc(inventoryLogs.createdAt) : desc(inventoryLogs.createdAt));
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
    const {
      variantId,
      changeType,
      quantityChange,
      previousQuantity,
      newQuantity,
      reason,
      performedBy,
      orderId,
    } = body;

    // Validate required fields
    if (!variantId) {
      return NextResponse.json(
        { error: 'variantId is required', code: 'MISSING_VARIANT_ID' },
        { status: 400 }
      );
    }

    if (!changeType) {
      return NextResponse.json(
        { error: 'changeType is required', code: 'MISSING_CHANGE_TYPE' },
        { status: 400 }
      );
    }

    if (!ALLOWED_CHANGE_TYPES.includes(changeType.toUpperCase())) {
      return NextResponse.json(
        {
          error: `changeType must be one of: ${ALLOWED_CHANGE_TYPES.join(', ')}`,
          code: 'INVALID_CHANGE_TYPE',
        },
        { status: 400 }
      );
    }

    if (quantityChange === undefined || quantityChange === null) {
      return NextResponse.json(
        { error: 'quantityChange is required', code: 'MISSING_QUANTITY_CHANGE' },
        { status: 400 }
      );
    }

    if (typeof quantityChange !== 'number' || isNaN(quantityChange)) {
      return NextResponse.json(
        { error: 'quantityChange must be a valid number', code: 'INVALID_QUANTITY_CHANGE' },
        { status: 400 }
      );
    }

    if (previousQuantity === undefined || previousQuantity === null) {
      return NextResponse.json(
        { error: 'previousQuantity is required', code: 'MISSING_PREVIOUS_QUANTITY' },
        { status: 400 }
      );
    }

    if (typeof previousQuantity !== 'number' || isNaN(previousQuantity) || previousQuantity < 0) {
      return NextResponse.json(
        { error: 'previousQuantity must be a non-negative number', code: 'INVALID_PREVIOUS_QUANTITY' },
        { status: 400 }
      );
    }

    if (newQuantity === undefined || newQuantity === null) {
      return NextResponse.json(
        { error: 'newQuantity is required', code: 'MISSING_NEW_QUANTITY' },
        { status: 400 }
      );
    }

    if (typeof newQuantity !== 'number' || isNaN(newQuantity) || newQuantity < 0) {
      return NextResponse.json(
        { error: 'newQuantity must be a non-negative number', code: 'INVALID_NEW_QUANTITY' },
        { status: 400 }
      );
    }

    if (!performedBy) {
      return NextResponse.json(
        { error: 'performedBy is required', code: 'MISSING_PERFORMED_BY' },
        { status: 400 }
      );
    }

    // Integrity check: newQuantity must equal previousQuantity + quantityChange
    if (newQuantity !== previousQuantity + quantityChange) {
      return NextResponse.json(
        {
          error: `Integrity check failed: newQuantity (${newQuantity}) must equal previousQuantity (${previousQuantity}) + quantityChange (${quantityChange})`,
          code: 'INTEGRITY_CHECK_FAILED',
        },
        { status: 400 }
      );
    }

    const newLog = await db
      .insert(inventoryLogs)
      .values({
        variantId: parseInt(variantId),
        changeType: changeType.toUpperCase(),
        quantityChange: parseInt(quantityChange),
        previousQuantity: parseInt(previousQuantity),
        newQuantity: parseInt(newQuantity),
        reason: reason || null,
        performedBy: parseInt(performedBy),
        orderId: orderId ? parseInt(orderId) : null,
        createdAt: Date.now(),
      })
      .returning();

    return NextResponse.json(newLog[0], { status: 201 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if user is trying to update immutable fields
    const immutableFields = [
      'variantId',
      'changeType',
      'quantityChange',
      'previousQuantity',
      'newQuantity',
      'performedBy',
      'orderId',
      'createdAt',
    ];

    const attemptedImmutableUpdate = immutableFields.some((field) => field in body);

    if (attemptedImmutableUpdate) {
      return NextResponse.json(
        {
          error: 'Only the reason field can be updated. Other fields are immutable for audit trail integrity.',
          code: 'IMMUTABLE_FIELD_UPDATE_ATTEMPTED',
        },
        { status: 400 }
      );
    }

    // Only allow reason to be updated
    const { reason } = body;

    // Check if inventory log exists
    const existingLog = await db
      .select()
      .from(inventoryLogs)
      .where(eq(inventoryLogs.id, parseInt(id)))
      .limit(1);

    if (existingLog.length === 0) {
      return NextResponse.json(
        { error: 'Inventory log not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updated = await db
      .update(inventoryLogs)
      .set({
        reason: reason !== undefined ? reason : existingLog[0].reason,
      })
      .where(eq(inventoryLogs.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if inventory log exists
    const existingLog = await db
      .select()
      .from(inventoryLogs)
      .where(eq(inventoryLogs.id, parseInt(id)))
      .limit(1);

    if (existingLog.length === 0) {
      return NextResponse.json(
        { error: 'Inventory log not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(inventoryLogs)
      .where(eq(inventoryLogs.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Inventory log deleted successfully',
        warning: 'Deleting inventory logs may compromise audit trail integrity',
        deletedLog: deleted[0],
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