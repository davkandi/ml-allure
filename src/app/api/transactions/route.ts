import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const VALID_METHODS = ['MOBILE_MONEY', 'CASH'] as const;
const VALID_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reference = searchParams.get('reference');

    // Single transaction by ID or reference
    if (id || reference) {
      let transaction;
      
      if (id) {
        if (isNaN(parseInt(id))) {
          return NextResponse.json({ 
            error: "Valid ID is required",
            code: "INVALID_ID" 
          }, { status: 400 });
        }
        
        const result = await db.select()
          .from(transactions)
          .where(eq(transactions.id, parseInt(id)))
          .limit(1);
        
        transaction = result[0];
      } else if (reference) {
        const result = await db.select()
          .from(transactions)
          .where(eq(transactions.reference, reference))
          .limit(1);
        
        transaction = result[0];
      }

      if (!transaction) {
        return NextResponse.json({ 
          error: 'Transaction not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(transaction);
    }

    // List transactions with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const provider = searchParams.get('provider');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db.select().from(transactions);
    const conditions = [];

    if (orderId) {
      conditions.push(eq(transactions.orderId, parseInt(orderId)));
    }

    if (status) {
      conditions.push(eq(transactions.status, status));
    }

    if (method) {
      conditions.push(eq(transactions.method, method));
    }

    if (provider) {
      conditions.push(eq(transactions.provider, provider));
    }

    if (startDate) {
      conditions.push(gte(transactions.createdAt, parseInt(startDate)));
    }

    if (endDate) {
      conditions.push(lte(transactions.createdAt, parseInt(endDate)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, method, provider, reference, status, verifiedBy, verifiedAt } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ 
        error: "Order ID is required",
        code: "MISSING_ORDER_ID" 
      }, { status: 400 });
    }

    if (!amount) {
      return NextResponse.json({ 
        error: "Amount is required",
        code: "MISSING_AMOUNT" 
      }, { status: 400 });
    }

    if (!method) {
      return NextResponse.json({ 
        error: "Payment method is required",
        code: "MISSING_METHOD" 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: "Transaction status is required",
        code: "MISSING_STATUS" 
      }, { status: 400 });
    }

    // Validate amount is positive
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        error: "Amount must be a positive number greater than 0",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    // Validate method
    if (!VALID_METHODS.includes(method)) {
      return NextResponse.json({ 
        error: `Method must be one of: ${VALID_METHODS.join(', ')}`,
        code: "INVALID_METHOD" 
      }, { status: 400 });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Validate verifiedBy if provided
    if (verifiedBy !== undefined && verifiedBy !== null && (typeof verifiedBy !== 'number' || verifiedBy < 1)) {
      return NextResponse.json({ 
        error: "verifiedBy must be a valid integer",
        code: "INVALID_VERIFIED_BY" 
      }, { status: 400 });
    }

    // Validate verifiedAt if provided
    if (verifiedAt !== undefined && verifiedAt !== null && (typeof verifiedAt !== 'number' || verifiedAt < 0)) {
      return NextResponse.json({ 
        error: "verifiedAt must be a valid timestamp",
        code: "INVALID_VERIFIED_AT" 
      }, { status: 400 });
    }

    const now = Date.now();
    const insertData: any = {
      orderId: parseInt(orderId),
      amount,
      method,
      status,
      createdAt: now,
      updatedAt: now,
    };

    if (provider) insertData.provider = provider;
    if (reference) insertData.reference = reference;
    if (verifiedBy) insertData.verifiedBy = parseInt(verifiedBy);
    if (verifiedAt) insertData.verifiedAt = verifiedAt;

    const newTransaction = await db.insert(transactions)
      .values(insertData)
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { amount, method, provider, reference, status, verifiedBy, verifiedAt } = body;

    // Check if transaction exists
    const existing = await db.select()
      .from(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Transaction not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Validate and update amount if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ 
          error: "Amount must be a positive number greater than 0",
          code: "INVALID_AMOUNT" 
        }, { status: 400 });
      }
      updateData.amount = amount;
    }

    // Validate and update method if provided
    if (method !== undefined) {
      if (!VALID_METHODS.includes(method)) {
        return NextResponse.json({ 
          error: `Method must be one of: ${VALID_METHODS.join(', ')}`,
          code: "INVALID_METHOD" 
        }, { status: 400 });
      }
      updateData.method = method;
    }

    // Validate and update status if provided
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updateData.status = status;

      // Auto-set verifiedAt when status changes to COMPLETED and verifiedBy is set
      if (status === 'COMPLETED' && (verifiedBy !== undefined || existing[0].verifiedBy) && !existing[0].verifiedAt && verifiedAt === undefined) {
        updateData.verifiedAt = Date.now();
      }
    }

    if (provider !== undefined) {
      updateData.provider = provider;
    }

    if (reference !== undefined) {
      updateData.reference = reference;
    }

    if (verifiedBy !== undefined) {
      if (verifiedBy !== null && (typeof verifiedBy !== 'number' || verifiedBy < 1)) {
        return NextResponse.json({ 
          error: "verifiedBy must be a valid integer",
          code: "INVALID_VERIFIED_BY" 
        }, { status: 400 });
      }
      updateData.verifiedBy = verifiedBy;
    }

    if (verifiedAt !== undefined) {
      if (verifiedAt !== null && (typeof verifiedAt !== 'number' || verifiedAt < 0)) {
        return NextResponse.json({ 
          error: "verifiedAt must be a valid timestamp",
          code: "INVALID_VERIFIED_AT" 
        }, { status: 400 });
      }
      updateData.verifiedAt = verifiedAt;
    }

    const updated = await db.update(transactions)
      .set(updateData)
      .where(eq(transactions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if transaction exists
    const existing = await db.select()
      .from(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Transaction not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Transaction deleted successfully',
      transaction: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}