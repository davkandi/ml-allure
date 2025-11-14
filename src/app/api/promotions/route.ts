import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, promotionUsage, customers } from '@/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { requireAuth, requireRoles, createAuthErrorResponse } from '@/lib/auth';

const VALID_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'];

interface CreatePromotionRequest {
  code: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startDate: number;
  endDate: number;
}

export async function POST(request: NextRequest) {
  // SECURITY: Only admins can create promotions
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  if (user.role !== 'ADMIN') {
    return createAuthErrorResponse(
      'Only administrators can create promotions',
      403
    );
  }

  try {
    const body: CreatePromotionRequest = await request.json();

    // Validation
    if (!body.code || !body.name || !body.type || body.value === undefined || !body.startDate || !body.endDate) {
      return NextResponse.json({
        error: 'Code, name, type, value, startDate, and endDate are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    // Validate promotion type
    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json({
        error: `Type must be one of: ${VALID_TYPES.join(', ')}`,
        code: 'INVALID_TYPE'
      }, { status: 400 });
    }

    // Validate value
    if (body.type === 'PERCENTAGE') {
      if (body.value < 0 || body.value > 100) {
        return NextResponse.json({
          error: 'Percentage value must be between 0 and 100',
          code: 'INVALID_PERCENTAGE'
        }, { status: 400 });
      }
    } else if (body.value < 0) {
      return NextResponse.json({
        error: 'Value must be non-negative',
        code: 'INVALID_VALUE'
      }, { status: 400 });
    }

    // Validate dates
    if (body.startDate >= body.endDate) {
      return NextResponse.json({
        error: 'End date must be after start date',
        code: 'INVALID_DATE_RANGE'
      }, { status: 400 });
    }

    // Check for duplicate code
    const existingPromo = await db.select()
      .from(promotions)
      .where(eq(promotions.code, body.code.toUpperCase()))
      .limit(1);

    if (existingPromo.length > 0) {
      return NextResponse.json({
        error: 'Promotion code already exists',
        code: 'DUPLICATE_CODE'
      }, { status: 400 });
    }

    const now = Date.now();

    const newPromotion = await db.insert(promotions)
      .values({
        code: body.code.toUpperCase(),
        name: body.name,
        description: body.description || null,
        type: body.type,
        value: body.value,
        minOrderValue: body.minOrderValue || null,
        maxDiscount: body.maxDiscount || null,
        usageLimit: body.usageLimit || null,
        usageCount: 0,
        perUserLimit: body.perUserLimit || null,
        startDate: body.startDate,
        endDate: body.endDate,
        isActive: true,
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newPromotion[0], { status: 201 });
  } catch (error) {
    console.error('Create promotion error:', error);
    return NextResponse.json({
      error: 'Failed to create promotion: ' + (error as Error).message,
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
    const code = searchParams.get('code');
    const isActive = searchParams.get('isActive');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get specific promotion by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid promotion ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const promotion = await db.select()
        .from(promotions)
        .where(eq(promotions.id, parseInt(id)))
        .limit(1);

      if (promotion.length === 0) {
        return NextResponse.json({
          error: 'Promotion not found',
          code: 'PROMOTION_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(promotion[0]);
    }

    // Get promotion by code (for validation/applying)
    if (code) {
      const promotion = await db.select()
        .from(promotions)
        .where(eq(promotions.code, code.toUpperCase()))
        .limit(1);

      if (promotion.length === 0) {
        return NextResponse.json({
          error: 'Promotion not found',
          code: 'PROMOTION_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(promotion[0]);
    }

    // List promotions
    // Only admins can see all promotions, customers see only active ones
    let query = db.select().from(promotions);
    const conditions = [];

    if (user.role === 'CUSTOMER') {
      conditions.push(eq(promotions.isActive, true));
      const now = Date.now();
      conditions.push(lte(promotions.startDate, now));
      conditions.push(gte(promotions.endDate, now));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(promotions.isActive, isActive === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(promotions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET promotions error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: Only admins can update promotions
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  if (user.role !== 'ADMIN') {
    return createAuthErrorResponse(
      'Only administrators can update promotions',
      403
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid promotion ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();

    // Fetch existing promotion
    const existingPromo = await db.select()
      .from(promotions)
      .where(eq(promotions.id, parseInt(id)))
      .limit(1);

    if (existingPromo.length === 0) {
      return NextResponse.json({
        error: 'Promotion not found',
        code: 'PROMOTION_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate type if provided
    if (body.type && !VALID_TYPES.includes(body.type)) {
      return NextResponse.json({
        error: `Type must be one of: ${VALID_TYPES.join(', ')}`,
        code: 'INVALID_TYPE'
      }, { status: 400 });
    }

    // Validate value if provided
    if (body.value !== undefined) {
      const type = body.type || existingPromo[0].type;
      if (type === 'PERCENTAGE' && (body.value < 0 || body.value > 100)) {
        return NextResponse.json({
          error: 'Percentage value must be between 0 and 100',
          code: 'INVALID_PERCENTAGE'
        }, { status: 400 });
      } else if (body.value < 0) {
        return NextResponse.json({
          error: 'Value must be non-negative',
          code: 'INVALID_VALUE'
        }, { status: 400 });
      }
    }

    // Validate dates if provided
    if (body.startDate !== undefined || body.endDate !== undefined) {
      const startDate = body.startDate || existingPromo[0].startDate;
      const endDate = body.endDate || existingPromo[0].endDate;

      if (startDate >= endDate) {
        return NextResponse.json({
          error: 'End date must be after start date',
          code: 'INVALID_DATE_RANGE'
        }, { status: 400 });
      }
    }

    // Check for duplicate code if changing code
    if (body.code && body.code.toUpperCase() !== existingPromo[0].code) {
      const duplicateCheck = await db.select()
        .from(promotions)
        .where(eq(promotions.code, body.code.toUpperCase()))
        .limit(1);

      if (duplicateCheck.length > 0) {
        return NextResponse.json({
          error: 'Promotion code already exists',
          code: 'DUPLICATE_CODE'
        }, { status: 400 });
      }
    }

    const now = Date.now();
    const updateData: any = {
      ...body,
      updatedAt: now,
    };

    if (body.code) {
      updateData.code = body.code.toUpperCase();
    }

    const updated = await db.update(promotions)
      .set(updateData)
      .where(eq(promotions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT promotions error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // SECURITY: Only admins can delete promotions
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  if (user.role !== 'ADMIN') {
    return createAuthErrorResponse(
      'Only administrators can delete promotions',
      403
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid promotion ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Soft delete: just deactivate
    const updated = await db.update(promotions)
      .set({
        isActive: false,
        updatedAt: Date.now(),
      })
      .where(eq(promotions.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({
        error: 'Promotion not found',
        code: 'PROMOTION_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Promotion deactivated successfully'
    });
  } catch (error) {
    console.error('DELETE promotions error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}
